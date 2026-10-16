
import axios from "axios";
import api from "../axios";
import type { Contract, ContractDocumentType } from "../../types/contract";

interface PaginatedContracts {
  results: Contract[];
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return (
      error.response?.data?.detail ??
      error.response?.data?.message ??
      fallback
    );
  }

  return fallback;
}

const contractService = {
  async getContracts(): Promise<Contract[]> {
    const response = await api.get<Contract[] | PaginatedContracts>(
      "/contracts/"
    );

    return Array.isArray(response.data)
      ? response.data
      : response.data.results;
  },

  async getDocument(
    id: string,
    documentType: ContractDocumentType
  ): Promise<Blob> {
    const response = await api.get<Blob>(
      `/contracts/${id}/download/${documentType}/`,
      { responseType: "blob" }
    );

    return response.data;
  },

  async download(
    id: string,
    documentType: ContractDocumentType
  ): Promise<void> {
    const blob = await this.getDocument(id, documentType);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      `${documentType === "generated" ? "contrat" : "contrat-signe"}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  async uploadSigned(id: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);

    await api.post(
      `/contracts/${id}/upload-signed/`,
      formData
    );
  },

  async cancel(id: string): Promise<void> {
    await api.post(`/contracts/${id}/cancel/`, {});
  },

  getErrorMessage,
};

export default contractService;
