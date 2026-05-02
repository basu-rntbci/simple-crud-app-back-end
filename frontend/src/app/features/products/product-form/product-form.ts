import { Component, OnInit, Input, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { DecimalPipe } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    DecimalPipe,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductFormComponent implements OnInit {
  /**
   * Route param bound via withComponentInputBinding().
   * Present when navigating to /products/:id/edit, absent for /products/new.
   */
  @Input() id?: string;

  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    price: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    image: [''],
  });

  readonly loading = signal(false);    // True while fetching existing product
  readonly saving = signal(false);     // True while POST/PUT is in-flight
  readonly isEdit = computed(() => !!this.id);

  /** Live preview of the image URL entered in the form. */
  readonly imagePreview = signal('');

  ngOnInit() {
    if (this.id) {
      this.loadProduct(this.id);
    }

    // Keep the image preview in sync with the form field
    this.form.controls.image.valueChanges.subscribe((url) =>
      this.imagePreview.set(url ?? ''),
    );
  }

  private loadProduct(id: string) {
    this.loading.set(true);
    this.productService.getById(id).subscribe({
      next: (res) => {
        const { name, price, quantity, image } = res.data;
        this.form.setValue({ name, price, quantity, image: image ?? '' });
        this.imagePreview.set(image ?? '');
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

  submit() {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    const payload = this.form.getRawValue() as {
      name: string;
      price: number;
      quantity: number;
      image: string;
    };

    const request$ = this.isEdit()
      ? this.productService.update(this.id!, payload)
      : this.productService.create(payload);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit() ? 'Product updated.' : 'Product created.',
          '',
          { duration: 3000, panelClass: 'snack-success' },
        );
        this.router.navigate(['/products']);
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(err.error?.message ?? 'Save failed. Please try again.', 'Dismiss', {
          duration: 4000,
          panelClass: 'snack-error',
        });
        this.saving.set(false);
      },
    });
  }
}
