'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import jsPDF from 'jspdf';

import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Define the InvoiceData interface, matching your Prisma select and API response
interface InvoiceData {
  invoiceName: string;
  invoiceNumber: string;
  currency: string;
  fromName: string;
  fromAddress: string;
  fromEmail: string;

  clientName: string;
  clientEmail: string;
  clientAddress: string;

  date: string; // ISO string
  dueDate: string; // Assuming this is a string in your data
  invoiceItemDescription: string; // Assuming a single item description for simplicity
  invoiceItemQuantity: number;
  invoiceItemRate: number;
  total: number;
  note: string;
}

export default function InvoicePage() {
  const params = useParams();
  const invoiceId = Array.isArray(params.invoiceId) ? params.invoiceId[0] : params.invoiceId;

  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoice/${invoiceId}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        const data: InvoiceData = await response.json();
        setInvoiceData(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const generatePdf = () => {
    if (!invoiceData) {
      console.error('Invoice data not loaded yet. Cannot generate PDF.');
      return;
    }

    // --- Define colors for the PDF (RGB values) ---
    const primaryColor = [40, 60, 80];
    const secondaryTextColor = [90, 90, 90];
    const accentColor = [0, 120, 215];
    const lightTextColor = [180, 180, 180];
    const darkTextColor = [30, 30, 30];
    const headerBgColor = [235, 235, 235];
    const tableRowEvenColor = [248, 248, 248];
    const separatorColor = [200, 200, 200];
    const whiteColor = [255, 255, 255];
    const blackColor = [0, 0, 0];

    // --- Initialize jsPDF document ---
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set default font for the entire document
    doc.setFont('helvetica');
    doc.setFontSize(10);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

    let yPos = 25;
    const marginX = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const standardLineHeight = 5;

    // --- Top Header Section (with Logo and Invoice Title) ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    const logoUrl = '/logo.png';
    try {
      doc.addImage(logoUrl, 'PNG', marginX, 8, 28, 24);
    } catch (e) {
      console.warn('Logo image could not be loaded or is invalid:', e);
      doc.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
      doc.setFontSize(16);
      doc.text('Your Logo', marginX, 22);
      doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      doc.setFontSize(10);
    }

    // Invoice Name (Title)
    doc.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text((invoiceData.invoiceName || '').toUpperCase(), pageWidth - marginX, 20, {
      align: 'right',
    }); // Added nullish coalescing

    // Company Name (from 'fromName') below the title in header band
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text((invoiceData.fromName || '').toLocaleUpperCase(), pageWidth - marginX, 28, {
      align: 'right',
    }); // Added nullish coalescing

    // Reset colors for main content area
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // --- Invoice Details (Number, Date, Due Date - left column) ---
    let currentLeftY = 60;
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('INVOICE DETAILS:', marginX, currentLeftY);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.setFontSize(10);

    doc.text(`Invoice No:`, marginX, currentLeftY + standardLineHeight * 1.5);
    doc.text(`${invoiceData.invoiceNumber || 'N/A'}`, marginX + 30, currentLeftY + standardLineHeight * 1.5); // Added nullish coalescing

    const formattedDate = new Date(invoiceData.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    doc.text(`Date:`, marginX, currentLeftY + standardLineHeight * 2.5);
    doc.text(`${formattedDate || 'N/A'}`, marginX + 30, currentLeftY + standardLineHeight * 2.5); // Added nullish coalescing

    let currentLeftContentHeight = standardLineHeight * 2.5;

    if (invoiceData.dueDate) {
      const formattedDueDate = new Date(invoiceData.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      doc.text(`Due Date:`, marginX, currentLeftY + standardLineHeight * 3.5);
      doc.text(`${formattedDueDate || 'N/A'}`, marginX + 30, currentLeftY + standardLineHeight * 3.5); // Added nullish coalescing
      currentLeftContentHeight = standardLineHeight * 3.5;
    }
    currentLeftY += currentLeftContentHeight + standardLineHeight * 2;

    // --- Client Information (Bill To - left column, below Invoice Details) ---
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('BILL TO:', marginX, currentLeftY);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.setFontSize(10);

    // Safely get client data, provide empty string fallback
    const clientName = invoiceData.clientName || '';
    const clientAddress = invoiceData.clientAddress || '';
    const clientEmail = invoiceData.clientEmail || '';

    doc.text(clientName, marginX, currentLeftY + standardLineHeight * 1.5);
    // Line 217 from your original code if `splitClientAddress` was the issue
    const splitClientAddress = doc.splitTextToSize(clientAddress, pageWidth / 2 - marginX - 5);
    doc.text(splitClientAddress, marginX, currentLeftY + standardLineHeight * 2.5);
    const clientAddressHeight = splitClientAddress.length * standardLineHeight;
    // Line 218 from your original code if `clientEmail` was the issue
    doc.text(clientEmail, marginX, currentLeftY + standardLineHeight * 2.5 + clientAddressHeight);

    currentLeftY += standardLineHeight * 2.5 + clientAddressHeight + standardLineHeight;

    // --- Sender Contact Information (Billed From - right column) ---
    const rightColumnX = pageWidth / 2 + 10;
    let currentRightY = 60;

    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('BILLED FROM:', rightColumnX, currentRightY);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.setFontSize(10);

    // Safely get from data, provide empty string fallback
    const fromName = invoiceData.fromName || '';
    const fromAddress = invoiceData.fromAddress || '';
    const fromEmail = invoiceData.fromEmail || '';

    doc.text(fromName, rightColumnX, currentRightY + standardLineHeight * 1.5);
    const splitFromAddress = doc.splitTextToSize(fromAddress, pageWidth / 2 - marginX - 5);
    doc.text(splitFromAddress, rightColumnX, currentRightY + standardLineHeight * 2.5);
    const fromAddressHeight = splitFromAddress.length * standardLineHeight;
    doc.text(fromEmail, rightColumnX, currentRightY + standardLineHeight * 2.5 + fromAddressHeight);

    currentRightY += standardLineHeight * 2.5 + fromAddressHeight + standardLineHeight;

    // --- Calculate overall content starting Y position ---
    yPos = Math.max(currentLeftY, currentRightY) + 15;

    doc.setDrawColor(separatorColor[0], separatorColor[1], separatorColor[2]);
    doc.line(marginX, yPos, pageWidth - marginX, yPos);
    yPos += 10;

    // --- Line Items Table Header ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
    doc.rect(marginX - 2, yPos - 5, pageWidth - (2 * marginX) + 4, 10, 'F');

    doc.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    const itemColWidth = (pageWidth - (2 * marginX) - 50) / 3;
    doc.text('Description', marginX, yPos);
    doc.text('Quantity', marginX + itemColWidth * 1.5 + 20, yPos, { align: 'center' });
    doc.text('Rate', marginX + itemColWidth * 2.5 + 20, yPos, { align: 'center' });
    doc.text('Amount', pageWidth - marginX, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    // --- Line Items Table Content ---
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

    doc.setFillColor(tableRowEvenColor[0], tableRowEvenColor[1], tableRowEvenColor[2]);
    doc.rect(marginX - 2, yPos - 5, pageWidth - (2 * marginX) + 4, 10, 'F');

    const itemAmount = (invoiceData.invoiceItemQuantity || 0) * (invoiceData.invoiceItemRate || 0); // Handle potential null/undefined
    const itemDescription = invoiceData.invoiceItemDescription || ''; // Provide fallback
    const splitItemDescription = doc.splitTextToSize(itemDescription, itemColWidth * 1.5);
    doc.text(splitItemDescription, marginX, yPos);
    const itemDescriptionHeight = splitItemDescription.length * standardLineHeight;

    doc.text(
      (invoiceData.invoiceItemQuantity || 0).toString(), // Ensure it's a string, fallback to 0
      marginX + itemColWidth * 1.5 + 20,
      yPos + itemDescriptionHeight / 2 - standardLineHeight / 2,
      { align: 'center' }
    );
    doc.text(
      (invoiceData.invoiceItemRate || 0).toFixed(2), // Ensure it's a number, fallback to 0
      marginX + itemColWidth * 2.5 + 20,
      yPos + itemDescriptionHeight / 2 - standardLineHeight / 2,
      { align: 'center' }
    );
    doc.text(
      itemAmount.toFixed(2),
      pageWidth - marginX,
      yPos + itemDescriptionHeight / 2 - standardLineHeight / 2,
      { align: 'right' }
    );

    yPos += Math.max(itemDescriptionHeight, standardLineHeight * 2) + 5;

    // --- Totals Section ---
    doc.setDrawColor(separatorColor[0], separatorColor[1], separatorColor[2]);
    doc.line(pageWidth - 70, yPos - 5, pageWidth - marginX, yPos - 5);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('TOTAL:', pageWidth - 80, yPos);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`${invoiceData.currency || ''} ${(invoiceData.total || 0).toFixed(2)}`, pageWidth - marginX, yPos, {
      align: 'right',
    }); // Added nullish coalescing
    doc.setFont('helvetica', 'normal');

    yPos += 20;

    // --- Notes Section ---
    if (invoiceData.note) {
      doc.setFontSize(10);
      doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
      doc.text('Notes:', marginX, yPos);
      const notesContent = invoiceData.note || ''; // Ensure notes are strings
      const splitNotes = doc.splitTextToSize(notesContent, pageWidth - 2 * marginX);
      doc.text(splitNotes, marginX, yPos + 7);
      yPos += splitNotes.length * standardLineHeight + 10;
    }

    // --- Footer ---
    doc.setFontSize(9);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text('Thank you for doing business with slyGems!', pageWidth / 2, pageHeight - 15, {
      align: 'center',
    });

    doc.output('dataurlnewwindow', { filename: `invoice-${invoiceData.invoiceNumber || 'Unknown'}.pdf` }); // Fallback for filename
  };

  // --- Render logic for the React component (Web Page) ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" size={32} color="grey" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-xl text-red-500">
          Error: {error}. Please try again.
        </p>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Invoice data not found for this ID.</p>
      </div>
    );
  }

  // Display basic invoice details using shadcn/ui Card components
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex flex-col items-center justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold mb-2">Invoice Details</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Preview and download your invoice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 mb-6">
            <p>
              <strong>Invoice Name:</strong> {invoiceData.invoiceName}
            </p>
            <p>
              <strong>Invoice Number:</strong> {invoiceData.invoiceNumber}
            </p>
            <p>
              <strong>Currency:</strong> {invoiceData.currency}
            </p>
            <p>
              <strong>From Name:</strong> {invoiceData.fromName}
            </p>
            <p>
              <strong>From Address:</strong> {invoiceData.fromAddress}
            </p>
            <p>
              <strong>From Email:</strong> {invoiceData.fromEmail}
            </p>
            <p>
              <strong>Client Name:</strong> {invoiceData.clientName}
            </p>
            <p>
              <strong>Client Address:</strong> {invoiceData.clientAddress}
            </p>
            <p>
              <strong>Client Email:</strong> {invoiceData.clientEmail}
            </p>
            <p>
              <strong>Date:</strong> {new Date(invoiceData.date).toLocaleDateString()}
            </p>
            <p>
              <strong>Due Date:</strong>{' '}
              {invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'N/A'}
            </p>
            {/* If invoiceItemDescription, Quantity, Rate are truly for a single item, display them directly */}
            <p className="sm:col-span-2">
              <strong>Item:</strong> {invoiceData.invoiceItemDescription}
            </p>
            <p>
              <strong>Quantity:</strong> {invoiceData.invoiceItemQuantity}
            </p>
            <p>
              <strong>Rate:</strong> {invoiceData.invoiceItemRate}
            </p>
            {/* Display total with currency and formatted to 2 decimal places */}
            <p className="text-sm font-semibold sm:col-span-2">
              Total{invoiceData.currency} {invoiceData.total.toFixed(2)}
            </p>
            {invoiceData.note && (
              <p className="sm:col-span-2">
                <strong>Notes:</strong> {invoiceData.note}
              </p>
            )}
          </div>
          <div className="text-center mt-6">
            <Button onClick={generatePdf} className="w-full sm:w-auto">
              Download Invoice PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}