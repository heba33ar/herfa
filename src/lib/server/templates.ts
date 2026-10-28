import "server-only";

import type { EmailMessage } from "./email";

/**
 * Escapes a value before it goes into an HTML email.
 *
 * Everything these templates interpolate — project names, buyer names, seller
 * notes — is typed by a user, so without this a quote or angle bracket breaks
 * the markup and a script tag travels to whoever opens the message.
 */
function esc(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Subjects are a single header line; a newline there would inject headers. */
function line(value: string | undefined): string {
  return (value ?? "").replace(/[\r\n]+/g, " ").trim();
}

const BRAND = "#7A3350";
const INK = "#33232B";
const SAND = "#F8F3ED";

function layout(heading: string, body: string, cta?: { label: string; href: string }) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="margin:0;padding:32px 16px;background:${SAND};font-family:'IBM Plex Sans Arabic',Tahoma,Arial,sans-serif;color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E7DCD8;">
      <tr>
        <td style="padding:28px 32px;border-bottom:1px solid #E7DCD8;">
          <span style="font-size:20px;font-weight:700;color:${BRAND};">حِرفة</span>
          <span style="font-size:11px;letter-spacing:3px;color:#8C7B82;margin-inline-start:8px;">HIRFA</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.4;">${heading}</h1>
          ${body}
          ${
            cta
              ? `<p style="margin:28px 0 0;"><a href="${cta.href}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 24px;font-weight:600;font-size:14px;">${esc(cta.label)}</a></p>`
              : ""
          }
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #E7DCD8;font-size:12px;color:#8C7B82;">
          منصة حِرفة — سوق المشاريع المنزلية النسائية في النقب
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function appUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export function welcomeEmail(name: string, to: string): EmailMessage {
  const html = layout(
    `أهلًا ${esc(name)} 👋`,
    `<p style="margin:0 0 14px;line-height:1.9;font-size:14px;">تم إنشاء حسابك على منصة حِرفة بنجاح.</p>
     <p style="margin:0;line-height:1.9;font-size:14px;">تقدري تتصفّحي المتاجر، تحفظي منتجاتك المفضّلة، وتتابعي طلباتك من مكان واحد.</p>`,
    { label: "ابدئي التصفّح", href: `${appUrl()}/stores` },
  );

  return {
    to,
    subject: "أهلًا بك في حِرفة",
    html,
    text: `أهلًا ${name}،\n\nتم إنشاء حسابك على منصة حِرفة بنجاح.\nتصفّحي المتاجر: ${appUrl()}/stores`,
    template: "welcome",
  };
}

/* -------------------------------------------------------------------------- */
/* Marketplace events                                                         */
/* -------------------------------------------------------------------------- */

export function orderPlacedEmail(
  to: string,
  sellerName: string,
  order: { reference: string; buyerName: string; total: string; items: string },
): EmailMessage {
  const html = layout(
    `طلب جديد #${esc(order.reference)}`,
    `<p style="margin:0 0 14px;line-height:1.9;font-size:14px;">أهلًا ${esc(sellerName)}، وصلك طلب جديد على متجرك.</p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="background:${SAND};border:1px solid #E7DCD8;padding:16px;width:100%;">
       <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">المشترية</td><td style="font-size:13px;padding:4px 0;font-weight:600;">${esc(order.buyerName)}</td></tr>
       <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">الطلب</td><td style="font-size:13px;padding:4px 0;">${esc(order.items)}</td></tr>
       <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">الإجمالي</td><td style="font-size:13px;padding:4px 0;font-weight:600;">${esc(order.total)}</td></tr>
     </table>
     <p style="margin:14px 0 0;line-height:1.9;font-size:13px;color:#8C7B82;">الطلب بحالة «بانتظار الرد» — ما بيصير مؤكّدًا إلا بعد موافقتك.</p>`,
    { label: "فتح لوحة الطلبات", href: `${appUrl()}/seller/orders` },
  );

  return {
    to,
    subject: line(`طلب جديد #${order.reference} — حِرفة`),
    html,
    text: `أهلًا ${sellerName}،\n\nوصلك طلب جديد #${order.reference}.\nالمشترية: ${order.buyerName}\nالطلب: ${order.items}\nالإجمالي: ${order.total}\n\nلوحة الطلبات: ${appUrl()}/seller/orders`,
    template: "order-placed",
  };
}

const STATUS_HEADLINE: Record<string, string> = {
  confirmed: "تم تأكيد طلبك",
  preparing: "طلبك قيد التجهيز",
  ready: "طلبك جاهز",
  completed: "تم إتمام طلبك",
  rejected: "اعتذرت البائعة عن الطلب",
  cancelled: "تم إلغاء الطلب",
  issue: "في مشكلة بالطلب",
};

export function orderStatusEmail(
  to: string,
  buyerName: string,
  order: { reference: string; storeName: string; status: string; note?: string },
): EmailMessage {
  const headline = STATUS_HEADLINE[order.status] ?? "تحديث على طلبك";
  const html = layout(
    `${esc(headline)} — #${esc(order.reference)}`,
    `<p style="margin:0 0 14px;line-height:1.9;font-size:14px;">أهلًا ${esc(buyerName)}، في تحديث على طلبك من <strong>${esc(order.storeName)}</strong>.</p>
     ${order.note ? `<p style="margin:0;padding:14px;background:${SAND};border:1px solid #E7DCD8;line-height:1.8;font-size:13px;">${esc(order.note)}</p>` : ""}`,
    { label: "متابعة الطلب", href: `${appUrl()}/account/orders` },
  );

  return {
    to,
    subject: line(`${headline} — حِرفة`),
    html,
    text: `أهلًا ${buyerName}،\n\n${headline} (#${order.reference}) من ${order.storeName}.${order.note ? `\n\n${order.note}` : ""}\n\nمتابعة: ${appUrl()}/account/orders`,
    template: "order-status",
  };
}

export function applicationSubmittedEmail(
  to: string,
  application: { projectName: string; ownerName: string; town: string; category: string },
): EmailMessage {
  const html = layout(
    "طلب انضمام جديد",
    `<p style="margin:0 0 14px;line-height:1.9;font-size:14px;">وصل طلب انضمام جديد بحاجة لمراجعة.</p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="background:${SAND};border:1px solid #E7DCD8;padding:16px;width:100%;">
       <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">المشروع</td><td style="font-size:13px;padding:4px 0;font-weight:600;">${esc(application.projectName)}</td></tr>
       <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">صاحبة المشروع</td><td style="font-size:13px;padding:4px 0;">${esc(application.ownerName)}</td></tr>
       <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">البلدة</td><td style="font-size:13px;padding:4px 0;">${esc(application.town)}</td></tr>
       <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">الفئة</td><td style="font-size:13px;padding:4px 0;">${esc(application.category)}</td></tr>
     </table>`,
    { label: "مراجعة الطلب", href: `${appUrl()}/admin/applications` },
  );

  return {
    to,
    subject: line(`طلب انضمام جديد: ${application.projectName}`),
    html,
    text: `طلب انضمام جديد.\n\nالمشروع: ${application.projectName}\nصاحبة المشروع: ${application.ownerName}\nالبلدة: ${application.town}\n\nمراجعة: ${appUrl()}/admin/applications`,
    template: "application-submitted",
  };
}

export function applicationDecisionEmail(
  to: string,
  ownerName: string,
  decision: {
    projectName: string;
    status: "accepted" | "rejected" | "needs_info";
    note: string;
    credentials?: { email: string; password: string };
  },
): EmailMessage {
  const headlines = {
    accepted: "تم قبول طلب انضمامك 🎉",
    rejected: "بخصوص طلب انضمامك",
    needs_info: "مطلوب استكمال بيانات طلبك",
  } as const;

  const credentialsBlock = decision.credentials
    ? `<p style="margin:14px 0 8px;line-height:1.9;font-size:14px;">بيانات الدخول إلى لوحة البائعة:</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="background:${SAND};border:1px solid #E7DCD8;padding:16px;width:100%;">
         <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">البريد الإلكتروني</td><td style="font-size:13px;padding:4px 0;font-weight:600;" dir="ltr">${esc(decision.credentials.email)}</td></tr>
         <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">كلمة المرور المؤقتة</td><td style="font-size:13px;padding:4px 0;font-weight:600;font-family:monospace;" dir="ltr">${esc(decision.credentials.password)}</td></tr>
       </table>`
    : "";

  const html = layout(
    headlines[decision.status],
    `<p style="margin:0 0 14px;line-height:1.9;font-size:14px;">أهلًا ${esc(ownerName)}، بخصوص مشروع <strong>${esc(decision.projectName)}</strong>:</p>
     <p style="margin:0;padding:14px;background:${SAND};border:1px solid #E7DCD8;line-height:1.8;font-size:13px;">${esc(decision.note)}</p>
     ${credentialsBlock}`,
    decision.status === "accepted"
      ? { label: "فتح لوحة البائعة", href: `${appUrl()}/login` }
      : undefined,
  );

  return {
    to,
    subject: line(`${headlines[decision.status]} — حِرفة`),
    html,
    text: `أهلًا ${ownerName}،\n\n${headlines[decision.status]}\nالمشروع: ${decision.projectName}\n\n${decision.note}${
      decision.credentials
        ? `\n\nالبريد: ${decision.credentials.email}\nكلمة المرور المؤقتة: ${decision.credentials.password}\n${appUrl()}/login`
        : ""
    }`,
    template: "application-decision",
    redact: decision.credentials ? [decision.credentials.password] : undefined,
  };
}

export function adminInviteEmail(
  name: string,
  to: string,
  password: string,
  roles: string[],
): EmailMessage {
  const rolesLabel = roles.join("، ");
  const html = layout(
    `أهلًا ${esc(name)} 👋`,
    `<p style="margin:0 0 14px;line-height:1.9;font-size:14px;">أنشأت إدارة حِرفة حسابًا لك على المنصة بصلاحية: <strong>${esc(rolesLabel)}</strong>.</p>
     <p style="margin:0 0 14px;line-height:1.9;font-size:14px;">بيانات الدخول:</p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="background:${SAND};border:1px solid #E7DCD8;padding:16px;width:100%;">
       <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">البريد الإلكتروني</td><td style="font-size:13px;padding:4px 0;font-weight:600;" dir="ltr">${esc(to)}</td></tr>
       <tr><td style="font-size:13px;padding:4px 0;color:#8C7B82;">كلمة المرور المؤقتة</td><td style="font-size:13px;padding:4px 0;font-weight:600;font-family:monospace;" dir="ltr">${esc(password)}</td></tr>
     </table>
     <p style="margin:14px 0 0;line-height:1.9;font-size:13px;color:#8C7B82;">يُنصح بتغيير كلمة المرور بعد أول تسجيل دخول.</p>`,
    { label: "تسجيل الدخول", href: `${appUrl()}/login` },
  );

  return {
    to,
    subject: "تم إنشاء حسابك على منصة حِرفة",
    html,
    text: `أهلًا ${name}،\n\nأنشأت إدارة حِرفة حسابًا لك (${rolesLabel}).\n\nالبريد: ${to}\nكلمة المرور المؤقتة: ${password}\n\nسجّلي الدخول: ${appUrl()}/login`,
    template: "admin-invite",
    redact: [password],
  };
}
