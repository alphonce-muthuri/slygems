import prisma from "@/app/utils/db";
import { requireUser } from "@/app/utils/hooks";
import { emailClient } from "@/app/utils/mailtrap";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ invoiceId: string }>;
  }
) {
  try {
    const session = await requireUser();

    const { invoiceId } = await params;

    const invoiceData = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: session.user?.id,
      },
    });

    if (!invoiceData) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const sender = {
      email: "hello@demomailtrap.co",
      name: "Sylvia wanjiru",
    };

    emailClient.send({
      from: sender,
      to: [{ email: "talktofonsey@gmail.co," }],
      template_uuid:"d1f19ec5-93aa-4fb5-ab09-7a338fb3fdfc",
      template_variables: {
        first_name: invoiceData.clientName,
        company_info_name: "Sly Gems",
        company_info_address: "Nairobi street 124",
        company_info_city: "Nairobi",
        company_info_zip_code: "345345",
        company_info_country: "Kenya",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send Email reminder" },
      { status: 500 }
    );
  }
}
