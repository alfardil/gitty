import { useQuery } from "@tanstack/react-query";

export interface PaymentHistoryItem {
  id: string;
  type: "subscription" | "one_time";
  amount: string;
  currency: string;
  date: string;
  status: string;
  description: string;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  pdfUrl: string | null;
}

interface PaymentHistoryResponse {
  success: boolean;
  data: {
    payments: PaymentHistoryItem[];
  };
}

const fetchPaymentHistory = async (): Promise<PaymentHistoryItem[]> => {
  const response = await fetch("/api/billing/payment-history");
  if (!response.ok) {
    throw new Error("Failed to fetch payment history");
  }
  const data: PaymentHistoryResponse = await response.json();
  return data.data.payments;
};

export function usePaymentHistory() {
  return useQuery({
    queryKey: ["payment-history"],
    queryFn: fetchPaymentHistory,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
