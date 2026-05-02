import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTooltipModule,
    DecimalPipe,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly deletingId = signal<string | null>(null);
  readonly searchQuery = signal('');

  private readonly _products = signal<Product[]>([]);

  /** Client-side search filter applied over the fetched products. */
  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return q
      ? this._products().filter((p) => p.name.toLowerCase().includes(q))
      : this._products();
  });

  /** Placeholder array for skeleton loading cards. */
  readonly skeletonItems = Array.from({ length: 6 });

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.productService.getAll().subscribe({
      next: (res) => {
        this._products.set(res.data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(err.error?.message ?? 'Failed to load products.', 'Dismiss', {
          duration: 4000,
          panelClass: 'snack-error',
        });
        this.loading.set(false);
      },
    });
  }

  confirmDelete(product: Product) {
    const dialogData: ConfirmDialogData = {
      title: 'Delete Product',
      message: `Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Keep it',
      severity: 'warn',
    };

    this.dialog
      .open(ConfirmDialogComponent, { data: dialogData, width: '400px' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.deleteProduct(product);
      });
  }

  private deleteProduct(product: Product) {
    this.deletingId.set(product._id);
    this.productService.delete(product._id).subscribe({
      next: () => {
        // Remove the product from local state without refetching
        this._products.update((list) => list.filter((p) => p._id !== product._id));
        this.snackBar.open(`"${product.name}" deleted.`, '', {
          duration: 3000,
          panelClass: 'snack-success',
        });
        this.deletingId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(err.error?.message ?? 'Delete failed.', 'Dismiss', {
          duration: 4000,
          panelClass: 'snack-error',
        });
        this.deletingId.set(null);
      },
    });
  }

  /** Determine stock badge colour based on quantity. */
  stockStatus(quantity: number): 'high' | 'low' | 'out' {
    if (quantity === 0) return 'out';
    if (quantity <= 5) return 'low';
    return 'high';
  }

  trackById(_: number, product: Product) {
    return product._id;
  }
}
