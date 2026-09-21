"use client";

import { FileText, Upload, X } from "lucide-react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

const MAX_MANUAL_SIZE = 26_214_400;

type Props = {
  disabled?: boolean;
  error?: string;
  file: File | null;
  onChange: (file: File | null, error?: string) => void;
};

function formatBytes(bytes: number): string {
  return `${(bytes / 1_048_576).toFixed(1)} MiB`;
}

function rejectionMessage(rejections: FileRejection[]): string {
  const code = rejections[0]?.errors[0]?.code;
  if (code === "file-too-large") return "El manual no puede superar los 25 MiB.";
  return "Selecciona un archivo PDF válido.";
}

export function ProductManualDropzone({ disabled = false, error, file, onChange }: Props) {
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    disabled,
    maxFiles: 1,
    maxSize: MAX_MANUAL_SIZE,
    multiple: false,
    onDrop: (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        onChange(null, rejectionMessage(fileRejections));
        return;
      }
      onChange(acceptedFiles[0] ?? null);
    },
  });

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="product-manual">Manual del producto</FieldLabel>
      <div
        {...getRootProps()}
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"}`}
      >
        <input {...getInputProps({ id: "product-manual" })} />
        {file ? (
          <>
            <FileText className="size-8 text-primary" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="font-medium">{file.name}</span>
              <span className="text-sm text-muted-foreground">{formatBytes(file.size)}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
            >
              <X data-icon="inline-start" />
              Quitar manual
            </Button>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">Arrastra un PDF aquí o selecciónalo</span>
            <span className="text-sm text-muted-foreground">Opcional · máximo 25 MiB</span>
          </>
        )}
      </div>
      <FieldDescription>Se procesará después de guardar los datos del producto.</FieldDescription>
      <FieldError>{error}</FieldError>
      {!file && !error ? <Alert><AlertDescription>El manual debe contener texto extraíble para poder indexarlo.</AlertDescription></Alert> : null}
    </Field>
  );
}