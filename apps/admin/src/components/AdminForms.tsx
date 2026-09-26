"use client";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Input as ValidatedInput,
  Select as ValidatedSelect,
  TextArea as ValidatedTextArea,
  FormValue,
  z,
} from "@repo/ui/forms";
import Image from "next/image";
import { Button } from "@heroui/react";
import { apiRequest } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
export {
  Form,
  FormScope,
  FormAction,
  Fieldset,
  FormValue,
  RadioField,
  CheckboxGroupField,
  SwitchField,
  SearchField,
  useFormAction,
  z,
} from "@repo/ui/forms";
function text(node: ReactNode): string {
  return Children.toArray(node)
    .map((n) =>
      typeof n === "string" || typeof n === "number"
        ? String(n)
        : isValidElement<{ children?: ReactNode }>(n)
          ? text(n.props.children)
          : "",
    )
    .join("");
}
type Kind =
  | "user"
  | "customer"
  | "courier"
  | "provider"
  | "order"
  | "address"
  | "ingredient";
type InputProps = ComponentProps<typeof ValidatedInput> & {
  entity?: Kind;
  customerId?: string;
};
export function Input({ entity, customerId, ...props }: InputProps) {
  const label = text(props.label) || props["aria-label"] || "";
  const kind =
    entity ||
    (/\bID\b/i.test(label) && !/stripe/i.test(label)
      ? (
          [
            "provider",
            "courier",
            "customer",
            "address",
            "order",
            "ingredient",
            "user",
          ] as Kind[]
        ).find((k) => label.toLowerCase().includes(k))
      : undefined);
  if (kind)
    return (
      <EntityInput
        {...props}
        entity={kind}
        customerId={customerId}
        label={label.replace(/\s*ID\b/i, "") || kind}
      />
    );
  if (props.type === "url" || /image.*url|logo.*url/i.test(label))
    return (
      <MediaInput
        {...props}
        label={text(props.label).replace(/\s*URLs?/gi, "") || "Image"}
      />
    );
  return <ValidatedInput {...props} />;
}
function EntityInput({
  entity,
  customerId,
  ...props
}: InputProps & { entity: Kind }) {
  const [rows, setRows] = useState<{ id: string; label: string }[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0),
    [query, setQuery] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ q: query });
      if (customerId) params.set("customerId", customerId);
      if (props.value) params.set("selected", String(props.value));
      void apiRequest<{ id: string; label: string }[]>(
        `/api/v1/operations/lookups/${entity}?${params}`,
        {
          headers: { Authorization: `Bearer ${requireAdminToken()}` },
          signal: abort.signal,
        },
      )
        .then((result) => {
          if (!abort.signal.aborted)
            setRows((previous) => {
              const selected = previous.find((row) => row.id === props.value);
              return selected && !result.some((row) => row.id === selected.id)
                ? [selected, ...result]
                : result;
            });
        })
        .catch((e) => {
          if (!abort.signal.aborted)
            setError(
              e instanceof Error ? e.message : "Unable to load options.",
            );
        })
        .finally(() => {
          if (!abort.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      abort.abort();
    };
  }, [entity, customerId, revision, query, props.value]);
  return (
    <div className={props.wrapperClassName}>
      <ValidatedSelect
        searchable
        name={props.name}
        label={props.label}
        aria-label={props["aria-label"]}
        required={props.required}
        disabled={props.disabled}
        onSearchChange={(value) => {
          if (
            value === `Choose ${entity}` ||
            value === rows.find((row) => row.id === props.value)?.label
          )
            return;
          setQuery(value);
        }}
        value={props.value}
        defaultValue={props.defaultValue}
        className={props.className}
        onChange={(e) => {
          if (e.target.value) setQuery("");
          props.onChange?.(e as React.ChangeEvent<HTMLInputElement>);
        }}
      >
        <option value="">{`Choose ${entity}`}</option>
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {row.label}
          </option>
        ))}
      </ValidatedSelect>
      {loading && (
        <p role="status" className="text-sm text-muted">
          Loading options…
        </p>
      )}
      {!loading && !rows.length && !error && (
        <p role="status" className="text-sm text-muted">
          {entity === "address" && !customerId
            ? "Choose a customer first."
            : "No available options."}
        </p>
      )}
      {error && (
        <div role="alert" className="text-sm text-danger">
          {error}{" "}
          <Button
            size="sm"
            variant="secondary"
            onPress={() => setRevision((v) => v + 1)}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
export function MediaInput(props: ComponentProps<typeof ValidatedInput>) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [fileRevision, setFileRevision] = useState(0),
    [hasPickedFile, setHasPickedFile] = useState(false);
  const id = useId();
  const value = String(props.value || "");
  return (
    <div className={props.wrapperClassName || "grid gap-2"}>
      <ValidatedInput
        key={fileRevision}
        type="file"
        onInput={() => setHasPickedFile(true)}
        label={text(props.label).replace(/\s*URLs?/gi, "") || "Image"}
        aria-label={props["aria-label"]}
        accept="image/jpeg,image/png"
        disabled={props.disabled || busy}
        schema={z
          .file()
          .max(5 * 1024 * 1024, "Choose an image up to 5 MB.")
          .mime(["image/jpeg", "image/png"])
          .nullable()}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve(String(reader.result).split(",")[1]!);
              reader.onerror = () => reject(new Error("Unable to read image."));
              reader.readAsDataURL(file);
            });
            const result = await apiRequest<{ url: string }>(
              "/api/v1/catalog/media",
              {
                method: "POST",
                headers: { Authorization: `Bearer ${requireAdminToken()}` },
                body: { base64, contentType: file.type },
              },
            );
            const url = new URL(
              result.url,
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8058",
            ).href;
            props.onChange?.({
              target: { value: url },
            } as React.ChangeEvent<HTMLInputElement>);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed.");
          } finally {
            setBusy(false);
            setFileRevision((revision) => revision + 1);
            setHasPickedFile(false);
          }
        }}
      />
      <FormValue
        name={`upload_${id}`}
        value={{ value, busy, error }}
        schema={z.object({
          value: props.required
            ? z.string().min(1, "Upload an image.")
            : z.string(),
          busy: z.literal(false, {
            error: "Wait for the image upload to finish.",
          }),
          error: z.literal("", {
            error: "Resolve the upload error before saving.",
          }),
        })}
      />
      {busy && <p role="status">Uploading image…</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {value && (
        <Image
          unoptimized
          src={value}
          alt="Current uploaded image"
          width={96}
          height={96}
          className="h-24 w-24 rounded-lg object-contain"
        />
      )}
      {(value || error || hasPickedFile) && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          isDisabled={busy || props.disabled}
          onPress={() => {
            setError("");
            setHasPickedFile(false);
            setFileRevision((revision) => revision + 1);
            props.onChange?.({
              target: { value: "" },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
        >
          {value ? "Remove image" : "Clear selected file"}
        </Button>
      )}
    </div>
  );
}
export function Select(props: ComponentProps<typeof ValidatedSelect>) {
  return <ValidatedSelect {...props} searchable={props.searchable ?? true} />;
}
export function TextArea(props: ComponentProps<typeof ValidatedTextArea>) {
  if (/gallery image/i.test(text(props.label)))
    return (
      <div className={props.wrapperClassName}>
        <p>Gallery images</p>
        {String(props.value || "")
          .split("\n")
          .filter(Boolean)
          .map((url, i) => (
            <MediaInput
              key={i}
              label={`Gallery image ${i + 1}`}
              value={url}
              onChange={(e) => {
                const values = String(props.value || "")
                  .split("\n")
                  .filter(Boolean);
                if (e.target.value) values[i] = e.target.value;
                else values.splice(i, 1);
                props.onChange?.({
                  target: { value: values.join("\n") },
                } as React.ChangeEvent<HTMLTextAreaElement>);
              }}
            />
          ))}
        <MediaInput
          label="Add gallery image"
          value=""
          onChange={(e) => {
            if (e.target.value)
              props.onChange?.({
                target: {
                  value: [String(props.value || ""), e.target.value]
                    .filter(Boolean)
                    .join("\n"),
                },
              } as React.ChangeEvent<HTMLTextAreaElement>);
          }}
        />
      </div>
    );
  return <ValidatedTextArea {...props} />;
}
