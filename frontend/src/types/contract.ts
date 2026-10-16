
export type ContractStatus = "GENERATED" | "SIGNED" | "CANCELLED";

export type ContractDocumentType = "generated" | "signed";

export interface Contract {
  id: string;
  reference: string;
  reservation: string;
  reservation_number: string;
  status: ContractStatus;
  generated_at: string | null;
  signed_at: string | null;
  cancelled_at: string | null;
  generated_available: boolean;
  signed_available: boolean;
}
