import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  Upload,
} from "lucide-react";

import { useRef, useState } from "react";

export interface VehicleImageItem {
  id?: string | number;
  image_url?: string | null;
  caption?: string | null;
  is_primary?: boolean;
  file?: File;
}

interface VehicleImageManagerProps {
  images: VehicleImageItem[];
  onChange: (images: VehicleImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

// Aligné sur VehicleImage.caption (CharField max_length=255)
const MAX_CAPTION_LENGTH = 255;

export default function VehicleImageManager({
  images,
  onChange,
  maxImages = 6,
  disabled = false,
}: VehicleImageManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (files: FileList | File[]) => {
    if (disabled) return;

    const incoming = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    const remaining = Math.max(0, maxImages - images.length);

    const selected = incoming.slice(0, remaining);

    const newImages: VehicleImageItem[] = selected.map(
      (file, index) => ({
        file,
        image_url: URL.createObjectURL(file),
        caption: "",
        is_primary: images.length === 0 && index === 0,
      }),
    );

    onChange([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    if (disabled) return;

    const image = images[index];

    if (image?.image_url?.startsWith("blob:")) {
      URL.revokeObjectURL(image.image_url);
    }

    const next = images.filter(
      (_, itemIndex) => itemIndex !== index,
    );

    if (
      next.length > 0 &&
      !next.some((item) => item.is_primary)
    ) {
      next[0] = {
        ...next[0],
        is_primary: true,
      };
    }

    onChange(next);
  };

  const setPrimary = (index: number) => {
    if (disabled) return;

    onChange(
      images.map((image, itemIndex) => ({
        ...image,
        is_primary: itemIndex === index,
      })),
    );
  };

  const updateCaption = (index: number, caption: string) => {
    const trimmed = caption.slice(0, MAX_CAPTION_LENGTH);

    onChange(
      images.map((image, itemIndex) =>
        itemIndex === index
          ? { ...image, caption: trimmed }
          : image,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Photos du véhicule
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Ajoutez jusqu'à {maxImages} photos. La première
              photo sera utilisée comme couverture.
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
            {images.length}/{maxImages}
          </span>
        </div>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);

          if (!disabled) {
            addFiles(event.dataTransfer.files);
          }
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
          dragging
            ? "border-gray-900 bg-gray-50"
            : "border-gray-200 bg-gray-50/70 hover:border-gray-300"
        }`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <Upload className="h-5 w-5 text-gray-500" />
        </div>

        <p className="mt-3 text-sm font-semibold text-gray-800">
          Glissez vos photos ici
        </p>

        <p className="mt-1 text-xs text-gray-500">
          JPG, PNG ou WEBP
        </p>

        <button
          type="button"
          disabled={disabled || images.length >= maxImages}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Ajouter des photos
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) {
              addFiles(event.target.files);
            }

            event.target.value = "";
          }}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={`${image.id ?? "new"}-${index}`}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {image.image_url ? (
                  <img
                    src={image.image_url}
                    alt={image.caption || `Photo ${index + 1}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-300" />
                  </div>
                )}

                {image.is_primary && (
                  <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    PRINCIPALE
                  </div>
                )}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-red-600 opacity-0 shadow-lg transition group-hover:opacity-100 disabled:hidden"
                  aria-label="Supprimer la photo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                {!image.is_primary && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setPrimary(index)}
                    className="absolute bottom-2 left-2 rounded-lg bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 opacity-0 shadow-lg transition group-hover:opacity-100"
                  >
                    Définir principale
                  </button>
                )}
              </div>

              <div className="p-3">
                <input
                  type="text"
                  value={image.caption ?? ""}
                  onChange={(event) =>
                    updateCaption(index, event.target.value)
                  }
                  placeholder="Description..."
                  maxLength={MAX_CAPTION_LENGTH}
                  disabled={disabled}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none transition focus:border-gray-400 focus:bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}