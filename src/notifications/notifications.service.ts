import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

type FeedbackWithRelations = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  contactName: string | null;
  contactPhone: string | null;
  contactMessage: string | null;
  contactConsent: boolean;
  kiosk: {
    name: string;
  };
  branch: {
    name: string;
  };
  tags: {
    tag: {
      name: string;
    };
  }[];
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true';

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  private getRecipients(notificationEmails?: string | null) {
    if (!notificationEmails?.trim()) return [];

    return notificationEmails
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
  }

  private getRatingLabel(rating: number) {
    switch (rating) {
      case 1:
        return 'Péssimo';
      case 2:
        return 'Ruim';
      case 3:
        return 'Ok';
      case 4:
        return 'Bom';
      case 5:
        return 'Excelente';
      default:
        return String(rating);
    }
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
  }

  private buildDailyHtml(
    companyName: string,
    feedbacks: FeedbackWithRelations[],
    dateLabel: string,
  ) {
    const items = feedbacks
      .map((feedback) => {
        const tags =
          feedback.tags.map((item) => item.tag.name).join(', ') || 'Sem tags';

        return `
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">${this.formatDate(feedback.createdAt)}</td>
            <td style="padding:8px;border:1px solid #ddd;">${feedback.branch?.name ?? '-'}</td>
            <td style="padding:8px;border:1px solid #ddd;">${feedback.kiosk?.name ?? '-'}</td>
            <td style="padding:8px;border:1px solid #ddd;">${this.getRatingLabel(feedback.rating)}</td>
            <td style="padding:8px;border:1px solid #ddd;">${feedback.comment ?? 'Sem comentário'}</td>
            <td style="padding:8px;border:1px solid #ddd;">${tags}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <div style="font-family:Arial,sans-serif;color:#111;">
        <h2>Resumo diário de feedbacks</h2>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Período:</strong> ${dateLabel}</p>
        <p><strong>Total de feedbacks:</strong> ${feedbacks.length}</p>

        <table style="border-collapse:collapse;width:100%;margin-top:16px;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Data</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Filial</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Kiosk</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Nota</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Comentário</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Tags</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
      </div>
    `;
  }

  private buildMonthlyHtml(
    companyName: string,
    feedbacks: FeedbackWithRelations[],
    periodLabel: string,
  ) {
    const total = feedbacks.length;

    const average =
      total > 0
        ? (
            feedbacks.reduce((sum, item) => sum + item.rating, 0) / total
          ).toFixed(2)
        : '0.00';

    const byBranch = feedbacks.reduce<Record<string, number>>((acc, item) => {
      const key = item.branch?.name ?? 'Sem filial';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const branchHtml = Object.entries(byBranch)
      .map(([branch, count]) => `<li><strong>${branch}:</strong> ${count}</li>`)
      .join('');

    return `
      <div style="font-family:Arial,sans-serif;color:#111;">
        <h2>Resumo mensal de feedbacks</h2>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Período:</strong> ${periodLabel}</p>
        <p><strong>Total de feedbacks:</strong> ${total}</p>
        <p><strong>Média das notas:</strong> ${average}</p>

        <h3>Distribuição por filial</h3>
        <ul>${branchHtml || '<li>Sem dados</li>'}</ul>
      </div>
    `;
  }

  private async sendMail(to: string[], subject: string, html: string) {
    const transporter = this.getTransporter();

    if (!transporter) {
      throw new Error('SMTP não configurado.');
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to.join(','),
      subject,
      html,
    });
  }

  async sendTestEmail(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        setting: true,
      },
    });

    if (!company) {
      throw new Error('Empresa não encontrada.');
    }

    const recipients = this.getRecipients(company.setting?.notificationEmails);

    if (recipients.length === 0) {
      throw new Error(
        'Nenhum e-mail de notificação configurado para esta empresa.',
      );
    }

    await this.sendMail(
      recipients,
      `Teste de envio - ${company.name}`,
      `
        <div style="font-family:Arial,sans-serif;color:#111;">
          <h2>Teste de e-mail do EvFeedback</h2>
          <p>Este é um envio de teste das notificações.</p>
          <p><strong>Empresa:</strong> ${company.name}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
          })}</p>
          <p>Se você recebeu esta mensagem, a configuração de SMTP está funcionando.</p>
        </div>
      `,
    );

    return {
      message: 'E-mail de teste enviado com sucesso.',
      recipients,
    };
  }

  @Cron('0 7 * * *', {
    timeZone: 'America/Sao_Paulo',
  })
  async sendDailyFeedbackDigest() {
    try {
      const yesterdayStart = new Date();
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);

      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const companies = await this.prisma.company.findMany({
        where: {
          active: true,
        },
        include: {
          setting: true,
        },
      });

      for (const company of companies) {
        try {
          const recipients = this.getRecipients(
            company.setting?.notificationEmails,
          );

          if (
            !company.setting?.dailyNotificationEnabled ||
            recipients.length === 0
          ) {
            continue;
          }

          const feedbacks = await this.prisma.feedback.findMany({
            where: {
              companyId: company.id,
              createdAt: {
                gte: yesterdayStart,
                lte: yesterdayEnd,
              },
            },
            include: {
              kiosk: true,
              branch: true,
              tags: {
                include: {
                  tag: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          });

          if (feedbacks.length === 0) {
            continue;
          }

          const dateLabel = new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'full',
            timeZone: 'America/Sao_Paulo',
          }).format(yesterdayStart);

          const html = this.buildDailyHtml(
            company.name,
            feedbacks as FeedbackWithRelations[],
            dateLabel,
          );

          await this.sendMail(
            recipients,
            `Resumo diário de feedbacks - ${company.name}`,
            html,
          );
        } catch (error) {
          this.logger.error(
            `Erro ao enviar resumo diário da empresa ${company.name}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Erro geral no cron diário de feedbacks',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  @Cron('0 8 1 * *', {
    timeZone: 'America/Sao_Paulo',
  })
  async sendMonthlyFeedbackDigest() {
    try {
      const now = new Date();

      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
        0,
        0,
        0,
        0,
      );

      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );

      const companies = await this.prisma.company.findMany({
        where: {
          active: true,
        },
        include: {
          setting: true,
        },
      });

      for (const company of companies) {
        try {
          const recipients = this.getRecipients(
            company.setting?.notificationEmails,
          );

          if (
            !company.setting?.monthlyNotificationEnabled ||
            recipients.length === 0
          ) {
            continue;
          }

          const feedbacks = await this.prisma.feedback.findMany({
            where: {
              companyId: company.id,
              createdAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
            include: {
              kiosk: true,
              branch: true,
              tags: {
                include: {
                  tag: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          });

          if (feedbacks.length === 0) {
            continue;
          }

          const periodLabel = `${monthStart.toLocaleDateString('pt-BR')} até ${monthEnd.toLocaleDateString('pt-BR')}`;

          const html = this.buildMonthlyHtml(
            company.name,
            feedbacks as FeedbackWithRelations[],
            periodLabel,
          );

          await this.sendMail(
            recipients,
            `Resumo mensal de feedbacks - ${company.name}`,
            html,
          );
        } catch (error) {
          this.logger.error(
            `Erro ao enviar resumo mensal da empresa ${company.name}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Erro geral no cron mensal de feedbacks',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
