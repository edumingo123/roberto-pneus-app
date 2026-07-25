import type {
  ClientDetail,
  ClientRecord,
  ClientWithVehicles,
  Gender,
  ClientStatus,
  PaginatedResult,
} from "./types";

export type {
  ClientDetail,
  ClientRecord,
  ClientWithVehicles,
  PaginatedResult,
};

export interface ClientFormInput {
  name: string;
  document: string;
  whatsapp: string;
  email?: string | null;
  birthDate?: string | null;
  gender: Gender;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string | null;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  notes?: string | null;
  status: ClientStatus;
}
