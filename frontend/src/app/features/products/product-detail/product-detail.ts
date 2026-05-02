import { Component, OnInit, Input, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent implements OnInit {
  /** Route param bound via withComponentInputBinding(). */
  @Input() id!: string;

  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly deleting = signal(false);

  ngOnInit() {
    this.productService.getById(this.id).subscribe({
      next: (res) => {
        this.product.set(res.data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(err.error?.message ?? 'Product not found.', 'Dismiss', {
          duration: 4000,
          panelClass: 'snack-error',
        });
        this.router.navigate(['/products']);
      },
    });
  }

  confirmDelete() {
    const p = this.product();
    if (!p) return;

    const data: ConfirmDialogData = {
      title: 'Delete Product',
      message: `Are you sure you want to permanently delete "${p.name}"?`,
      confirmText: 'Delete',
      severity: 'warn',
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: '400px' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.delete();
      });
  }

  private delete() {
    const p = this.product();
    if (!p) return;

    this.deleting.set(true);
    this.productService.delete(p._id).subscribe({
      next: () => {
        this.snackBar.open(`"${p.name}" deleted.`, '', {
          duration: 3000,
          panelClass: 'snack-success',
        });
        this.router.navigate(['/products']);
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(err.error?.message ?? 'Delete failed.', 'Dismiss', {
          duration: 4000,
          panelClass: 'snack-error',
        });
        this.deleting.set(false);
      },
    });
  }

  stockLabel(quantity: number): string {
    if (quantity === 0) return 'Out of stock';
    if (quantity <= 5) return `Low stock`;
    return 'In stock';
  }

  stockClass(quantity: number): string {
    if (quantity === 0) return 'out';
    if (quantity <= 5) return 'low';
    return 'high';
  }
}
