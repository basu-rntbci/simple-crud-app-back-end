import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  CreateProductRequest,
  ProductResponse,
  ProductsResponse,
  UpdateProductRequest,
} from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/products`;

  /** Fetch all products belonging to the authenticated user. */
  getAll() {
    return this.http.get<ProductsResponse>(this.base);
  }

  /** Fetch a single product by its MongoDB _id. */
  getById(id: string) {
    return this.http.get<ProductResponse>(`${this.base}/${id}`);
  }

  /** Create a new product. */
  create(payload: CreateProductRequest) {
    return this.http.post<ProductResponse>(this.base, payload);
  }

  /** Partially update a product. */
  update(id: string, payload: UpdateProductRequest) {
    return this.http.put<ProductResponse>(`${this.base}/${id}`, payload);
  }

  /** Permanently delete a product. */
  delete(id: string) {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.base}/${id}`,
    );
  }
}
