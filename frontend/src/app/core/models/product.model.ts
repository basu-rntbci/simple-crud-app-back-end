/** A product document as returned by the API */
export interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for GET /products */
export interface ProductsResponse {
  success: boolean;
  count: number;
  data: Product[];
}

/** Response shape for GET /products/:id, POST, and PUT */
export interface ProductResponse {
  success: boolean;
  data: Product;
}

/** Payload for creating a new product */
export interface CreateProductRequest {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

/** Payload for updating — all fields are optional */
export type UpdateProductRequest = Partial<CreateProductRequest>;
