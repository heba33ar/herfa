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
          heading: "للبائعات",
          paragraphs: [
            "عندك سؤال عن الانضمام، عن متجرك، أو عن طلب معيّن؟ تواصلي معنا وبنرجع لك.",
            "البريد: sellers@hirfa.example — واتساب الدعم: 050-000-0000",
          ],
        },
        {
          heading: "للمشتريات",
          paragraphs: [
            "في مشكلة في طلب؟ أسرع طريقة هي الإبلاغ عن المشكلة من صفحة الطلب نفسه، لأنها بتوصل فريق الدعم مع كل تفاصيل الطلب.",
            "البريد: support@hirfa.example",
          ],
        },
        {
          heading: "شراكات",
          paragraphs: [
            "سلطات محلية، جمعيات، مراكز نسائية، ومؤسسات ريادة — نحن منفتحون على الشراكات اللي بتوسّع وصول المشاريع.",
            "البريد: partners@hirfa.example",
          ],
        },
        {
          heading: "ملاحظة",
          paragraphs: [
            "عناوين التواصل أعلاه عناوين عرض ضمن النسخة الأولية، وبتتبدّل بعناوين فعلية قبل الإطلاق.",
          ],
        },
      ]}
    />
  );
}
