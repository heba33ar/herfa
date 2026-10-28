import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "تواصلي معنا" };

export default function ContactPage() {
  return (
    <ProsePage
      title="تواصلي معنا"
      description="فريق حِرفة بيردّ خلال أيام عمل قليلة."
      sections={[
        {
          heading: "التواصل مع فريق حِرفة",
          paragraphs: [
            "لأي سؤال عن الانضمام كبائعة، عن طلب معيّن، أو عن شراكة — تواصلي معنا عبر البريد الإلكتروني وبنرجع لك في أقرب وقت.",
            "البريد: ayatabusrar05@gmail.com",
          ],
        },
        {
          heading: "في مشكلة في طلب؟",
          paragraphs: [
            "أسرع طريقة هي الإبلاغ عن المشكلة من صفحة الطلب نفسه. البلاغ بيوصل فريق الدعم مع كل تفاصيل الطلب، بدل ما تشرحيها من جديد.",
          ],
        },
        {
          heading: "ملاحظة عن هذه النسخة",
          paragraphs: [
            "هذه نسخة أولية (نموذج أوّلي) لعرض فكرة المنصة. البيانات المعروضة فيها تجريبية، ولسّا ما تم إطلاق المنصة للجمهور.",
          ],
        },
      ]}
    />
  );
}
