import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { createHash, randomBytes } from 'node:crypto';

type FeedbackWithRelations = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  contactName: string | null;
  contactPhone: string | null;
  contactMessage: string | null;
  contactConsent: boolean;
  kiosk: { name: string } | null;
  branch: { name: string } | null;
  tags: { tag: { name: string } }[];
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly timeZone = 'America/Sao_Paulo';

  constructor(private readonly prisma: PrismaService) { }

  private getTransporter() {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const secure = process.env.SMTP_SECURE === 'true';

    if (!host || !user || !pass) return null;

    const options = {
      host,
      port,
      secure,
      auth: { user, pass },

      family: 4,

      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    } as SMTPTransport.Options & { family: 4 };

    return nodemailer.createTransport(options);
  }

  private getRecipients(notificationEmails?: string | null) {
    if (!notificationEmails?.trim()) return [];

    return Array.from(
      new Set(
        notificationEmails
          .split(',')
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
  }

  private getPublicAppUrl() {
    return (
      process.env.PUBLIC_APP_URL?.trim().replace(/\/$/, '') ||
      'http://localhost:5173'
    );
  }

  private async getPublicFeedbackUrl(companyId: string) {
    const existing = await this.prisma.sharedFeedbackAccess.findFirst({
      where: {
        companyId,
        active: true,
        publicToken: {
          not: null,
        },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        publicToken: true,
      },
    });

    if (existing?.publicToken) {
      return `${this.getPublicAppUrl()}/shared/feedbacks?token=${encodeURIComponent(
        existing.publicToken,
      )}`;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.sharedFeedbackAccess.create({
      data: {
        companyId,
        label: 'Relatório automático',
        tokenHash,
        publicToken: token,
        active: true,
        expiresAt,
      },
    });

    return `${this.getPublicAppUrl()}/shared/feedbacks?token=${encodeURIComponent(
      token,
    )}`;
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

  private formatDateParam(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private withDateFilters(publicUrl: string | null, start: Date, end: Date) {
    if (!publicUrl) return null;

    const separator = publicUrl.includes('?') ? '&' : '?';

    return `${publicUrl}${separator}startDate=${this.formatDateParam(
      start,
    )}&endDate=${this.formatDateParam(end)}`;
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: this.timeZone,
    }).format(date);
  }

  private formatDateOnly(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeZone: this.timeZone,
    }).format(date);
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private getAverageRating(feedbacks: FeedbackWithRelations[]) {
    if (feedbacks.length === 0) return '0.00';

    return (
      feedbacks.reduce((sum, item) => sum + item.rating, 0) / feedbacks.length
    ).toFixed(2);
  }

  private buildFeedbackRows(feedbacks: FeedbackWithRelations[]) {
    return feedbacks
      .slice(0, 20)
      .map((feedback) => {
        const tags =
          feedback.tags.map((item) => item.tag.name).join(', ') || 'Sem tags';

        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#334155;">
              ${this.escapeHtml(this.formatDate(feedback.createdAt))}
            </td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#334155;">
              ${this.escapeHtml(feedback.branch?.name ?? '-')}
            </td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#334155;">
              ${this.escapeHtml(feedback.kiosk?.name ?? '-')}
            </td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#0f172a;font-weight:700;">
              ${this.escapeHtml(this.getRatingLabel(feedback.rating))}
            </td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#334155;">
              ${this.escapeHtml(feedback.comment ?? 'Sem comentário')}
            </td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#334155;">
              ${this.escapeHtml(tags)}
            </td>
          </tr>
        `;
      })
      .join('');
  }

  private buildProfessionalReportHtml(params: {
    title: string;
    companyName: string;
    periodLabel: string;
    feedbacks: FeedbackWithRelations[];
    publicUrl?: string | null;
    mode: 'daily' | 'monthly' | 'test';
  }) {
    const { title, companyName, periodLabel, feedbacks, publicUrl, mode } =
      params;

    const total = feedbacks.length;
    const average = this.getAverageRating(feedbacks);
    const rows = this.buildFeedbackRows(feedbacks);

    const safePublicUrl = publicUrl ? encodeURI(publicUrl) : null;

    return `
      <div style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:760px;margin:0 auto;padding:28px 16px;">
          <div style="background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="background:#0f172a;padding:28px 30px;color:#ffffff;">
              <p style="margin:0 0 8px;font-size:12px;color:#cbd5e1;letter-spacing:.12em;text-transform:uppercase;font-weight:700;">
                EvFeedback
              </p>

              <h1 style="margin:0;font-size:24px;line-height:1.25;">
                ${this.escapeHtml(title)}
              </h1>

              <p style="margin:10px 0 0;font-size:14px;color:#cbd5e1;line-height:1.6;">
                Relatório automático de satisfação, atendimento e experiência do cliente.
              </p>
            </div>

            <div style="padding:28px 30px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">
                Olá,
              </p>

              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                Segue o resumo dos feedbacks recebidos no período selecionado. Use estes dados para acompanhar a percepção dos clientes, identificar pontos críticos e agir com mais velocidade.
              </p>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin:22px 0;">
                <p style="margin:0 0 8px;font-size:14px;color:#475569;">
                  <strong style="color:#0f172a;">Empresa:</strong> ${this.escapeHtml(companyName)}
                </p>

                <p style="margin:0 0 8px;font-size:14px;color:#475569;">
                  <strong style="color:#0f172a;">Período:</strong> ${this.escapeHtml(periodLabel)}
                </p>

                <p style="margin:0 0 8px;font-size:14px;color:#475569;">
                  <strong style="color:#0f172a;">Total de feedbacks:</strong> ${total}
                </p>

                <p style="margin:0;font-size:14px;color:#475569;">
                  <strong style="color:#0f172a;">Média das notas:</strong> ${average}
                </p>
              </div>

              ${safePublicUrl
        ? `
                    <div style="margin:24px 0;padding:18px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;">
                      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1e3a8a;">
                        Acesse o relatório completo com os filtros do período já aplicados:
                      </p>

                      <a href="${safePublicUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700;font-size:14px;">
                        Acessar relatório completo
                      </a>

                      <p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#475569;">
                        Caso o botão não abra, copie e cole este link no navegador:<br />
                        <span style="color:#2563eb;word-break:break-all;">${this.escapeHtml(safePublicUrl)}</span>
                      </p>
                    </div>
                  `
        : `
                    <div style="margin:24px 0;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px;">
                      <p style="margin:0;font-size:14px;line-height:1.6;color:#92400e;">
                        Nenhum link público ativo foi encontrado para esta empresa. Crie um link compartilhado nas configurações para exibir o botão de consulta no e-mail.
                      </p>
                    </div>
                  `
      }

              ${total > 0
        ? `
                    <h2 style="margin:28px 0 12px;font-size:18px;color:#0f172a;">
                      Últimos feedbacks do período
                    </h2>

                    <div style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:12px;">
                      <table style="border-collapse:collapse;width:100%;min-width:680px;background:#ffffff;">
                        <thead>
                          <tr style="background:#f8fafc;">
                            <th style="padding:10px;text-align:left;font-size:12px;color:#475569;border-bottom:1px solid #e5e7eb;">Data</th>
                            <th style="padding:10px;text-align:left;font-size:12px;color:#475569;border-bottom:1px solid #e5e7eb;">Filial</th>
                            <th style="padding:10px;text-align:left;font-size:12px;color:#475569;border-bottom:1px solid #e5e7eb;">Kiosk</th>
                            <th style="padding:10px;text-align:left;font-size:12px;color:#475569;border-bottom:1px solid #e5e7eb;">Nota</th>
                            <th style="padding:10px;text-align:left;font-size:12px;color:#475569;border-bottom:1px solid #e5e7eb;">Comentário</th>
                            <th style="padding:10px;text-align:left;font-size:12px;color:#475569;border-bottom:1px solid #e5e7eb;">Tags</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${rows}
                        </tbody>
                      </table>
                    </div>

                    ${feedbacks.length > 20
          ? `<p style="margin:12px 0 0;font-size:12px;color:#64748b;">Exibindo os 20 primeiros registros. Acesse o relatório completo para ver todos.</p>`
          : ''
        }
                  `
        : `
                    <div style="margin:24px 0;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:16px;">
                      <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
                        Nenhum feedback foi encontrado para este período. O link do relatório permanece disponível para consulta.
                      </p>
                    </div>
                  `
      }

              <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
                Este e-mail foi enviado automaticamente pelo EvFeedback.
                ${mode === 'test'
        ? ' Este envio de teste utiliza dados reais do período selecionado para validar o layout, o link público e a configuração de notificação.'
        : ''
      }
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private async sendMail(to: string[], subject: string, html: string) {
    const transporter = this.getTransporter();

    if (!transporter) {
      throw new BadRequestException('SMTP não configurado.');
    }

    try {
      await transporter.verify();

      await transporter.sendMail({
        from: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim(),
        to: to.join(','),
        subject,
        html,
      });

      this.logger.log(`E-mail enviado para: ${to.join(', ')}`);
    } catch (error) {
      this.logger.error(
        'Erro SMTP ao enviar e-mail',
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao enviar e-mail.',
      );
    }
  }

  async sendTestEmail(companyId: string) {
    const normalizedCompanyId = companyId?.trim();

    if (!normalizedCompanyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: normalizedCompanyId },
      include: { setting: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const recipients = this.getRecipients(company.setting?.notificationEmails);

    if (recipients.length === 0) {
      throw new BadRequestException(
        'Nenhum e-mail de notificação configurado para esta empresa.',
      );
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const feedbacks = (await this.getFeedbacksForRange(
      company.id,
      startDate,
      endDate,
    )) as FeedbackWithRelations[];

    const publicUrl = this.withDateFilters(
      await this.getPublicFeedbackUrl(company.id),
      startDate,
      endDate,
    );

    const periodLabel = `${startDate.toLocaleDateString(
      'pt-BR',
    )} até ${endDate.toLocaleDateString('pt-BR')}`;

    const html = this.buildProfessionalReportHtml({
      title: 'Teste de relatório de feedbacks',
      companyName: company.name,
      periodLabel,
      feedbacks,
      publicUrl,
      mode: 'test',
    });

    await this.sendMail(recipients, `Teste de envio - ${company.name}`, html);

    return {
      message: 'E-mail de teste enviado com sucesso.',
      recipients,
      totalFeedbacks: feedbacks.length,
      publicUrl,
    };
  }

  private async getActiveCompaniesWithSettings() {
    return this.prisma.company.findMany({
      where: { active: true },
      include: { setting: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async getFeedbacksForRange(
    companyId: string,
    start: Date,
    end: Date,
  ) {
    return this.prisma.feedback.findMany({
      where: {
        companyId,
        createdAt: {
          gte: start,
          lte: end,
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
      orderBy: { createdAt: 'asc' },
    });
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

      const companies = await this.getActiveCompaniesWithSettings();

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

          const feedbacks = (await this.getFeedbacksForRange(
            company.id,
            yesterdayStart,
            yesterdayEnd,
          )) as FeedbackWithRelations[];

          if (feedbacks.length === 0) continue;

          const dateLabel = this.formatDateOnly(yesterdayStart);
          const publicUrl = this.withDateFilters(
            await this.getPublicFeedbackUrl(company.id),
            yesterdayStart,
            yesterdayEnd,
          );

          const html = this.buildProfessionalReportHtml({
            title: 'Resumo diário de feedbacks',
            companyName: company.name,
            periodLabel: dateLabel,
            feedbacks,
            publicUrl,
            mode: 'daily',
          });

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

      const companies = await this.getActiveCompaniesWithSettings();

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

          const feedbacks = (await this.getFeedbacksForRange(
            company.id,
            monthStart,
            monthEnd,
          )) as FeedbackWithRelations[];

          if (feedbacks.length === 0) continue;

          const periodLabel = `${monthStart.toLocaleDateString(
            'pt-BR',
          )} até ${monthEnd.toLocaleDateString('pt-BR')}`;

          const publicUrl = this.withDateFilters(
            await this.getPublicFeedbackUrl(company.id),
            monthStart,
            monthEnd,
          );

          const html = this.buildProfessionalReportHtml({
            title: 'Resumo mensal de feedbacks',
            companyName: company.name,
            periodLabel,
            feedbacks,
            publicUrl,
            mode: 'monthly',
          });

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