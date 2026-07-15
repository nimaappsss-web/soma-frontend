import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

import { useSchoolSettings } from "../api";
import { useUpdateSchool } from "../../../features/principal/api";
import { uploadFile } from "../../../utils/upload";
import { transformError } from "../../../utils/transformError";
import { ArrayInput } from "./ArrayInput";
import type { SchoolSetting } from "../types";

export const SchoolSettingsContent = () => {
  const { data: settings, isLoading } = useSchoolSettings();
  const updateSchool = useUpdateSchool();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [savingSchool, setSavingSchool] = useState(false);

  useEffect(() => {
    if (settings && settings.length > 0) {
      const initial: Record<string, unknown> = {};
      for (const s of settings) {
        initial[s.key] = s.value;
      }
      setValues((prev) => {
        const merged = { ...prev };
        let changed = false;
        for (const s of settings) {
          if (!(s.key in prev)) {
            merged[s.key] = s.value;
            changed = true;
          }
        }
        return changed ? merged : prev;
      });
    }
  }, [settings]);

  const setVal = (key: string, val: unknown) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const onSaveSchool = async () => {
    setSavingSchool(true);
    try {
      let logoUrl: string | null | undefined;
      if (logoFile) {
        logoUrl = await uploadFile(logoFile);
      }
      const payload: Record<string, unknown> = {};
      for (const s of settings ?? []) {
        if (s.key === "logo" && logoUrl) {
          payload.logo = logoUrl;
        } else if (s.editable) {
          const current = values[s.key];
          if (current !== s.value) {
            payload[s.key] = current;
          }
        }
      }
      if (Object.keys(payload).length === 0) {
        toast.success("Nothing to update");
        return;
      }
      await updateSchool.mutateAsync(payload);
      setLogoFile(null);
      toast.success("School settings saved!");
    } catch (err) {
      toast.error(transformError(err));
    } finally {
      setSavingSchool(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-400">Loading school settings...</p>
      </div>
    );
  }

  if (!settings || settings.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-400">No school settings available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">School Settings</h3>
        <div className="space-y-5">
          {settings.map((setting) => (
            <SettingField
              key={setting.key}
              setting={setting}
              value={values[setting.key]}
              logoFile={logoFile}
              fileInputRef={fileInputRef}
              onChange={(val) => setVal(setting.key, val)}
              onLogoFile={(f) => setLogoFile(f)}
            />
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onSaveSchool}
            disabled={savingSchool}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {savingSchool ? "Saving..." : "Save School Settings"}
          </button>
        </div>
      </section>
    </div>
  );
};

const SettingField = ({
  setting,
  value,
  logoFile,
  fileInputRef,
  onChange,
  onLogoFile,
}: {
  setting: SchoolSetting;
  value: unknown;
  logoFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (val: unknown) => void;
  onLogoFile: (f: File | null) => void;
}) => {
  const disabled = !setting.editable;

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{setting.label}</label>

      {setting.type === "text" && (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-400"
        />
      )}

      {setting.type === "textarea" && (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-400"
        />
      )}

      {setting.type === "image" && (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
            {value ? (
              <img
                src={logoFile ? URL.createObjectURL(logoFile) : (value as string)}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400">No logo</span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {value || logoFile ? "Change" : "Upload"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onLogoFile(f);
            }}
            className="hidden"
          />
        </div>
      )}

      {setting.type === "pattern" && (
        <div>
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Use {"{level}"} {"{section}"} and {"{number}"} as placeholders
          </p>
        </div>
      )}

      {setting.type === "multi-select" && (
        <div>
          <div className="flex flex-wrap gap-2">
            {setting.options?.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const arr = (Array.isArray(value) ? [...value] : []) as string[];
                    const next = selected
                      ? arr.filter((v) => v !== opt.value)
                      : [...arr, opt.value];
                    onChange(next);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {setting.type === "array" && (
        <ArrayInput
          value={(Array.isArray(value) ? value : []) as string[]}
          onChange={(next) => onChange(next)}
          disabled={disabled}
        />
      )}

      {!setting.editable && setting.editableReason && (
        <p className="text-xs text-amber-600 mt-1">{setting.editableReason}</p>
      )}
    </div>
  );
};
