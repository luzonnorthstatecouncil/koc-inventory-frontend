import { useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ACCEPTED_EXTENSIONS, MAX_IMPORT_ROWS, checkFile, missingColumnsMessage, readSheet } from "@/helpers/bulkImport";
import { cn } from "@/lib/utils";

const plural = (n, one, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

function RowStatus({ row }) {
   if (row.errors.length) {
      return (
         <ul className='flex flex-col gap-0.5'>
            {row.errors.map((e) => (
               <li key={e} className='flex gap-1.5 text-xs text-red-700'>
                  <span className='mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500' aria-hidden='true' />
                  {e}
               </li>
            ))}
         </ul>
      );
   }
   if (row.blockedByGroup) {
      return (
         <p className='flex gap-1.5 text-xs text-amber-700'>
            <span className='mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500' aria-hidden='true' />
            Skipped: another row of this item has a problem, so the whole item waits.
         </p>
      );
   }
   return (
      <p className='inline-flex items-center gap-1.5 text-xs text-neutral-600'>
         <span className='size-1.5 rounded-full bg-emerald-500' aria-hidden='true' />
         Ready
      </p>
   );
}

/**
 * Template → file → preview (every row checked) → import the ready rows.
 *
 * - columns / validate(rows): from helpers/bulkImport
 * - refsReady: reference data (categories, items, suppliers) is loaded
 * - downloadTemplate(): builds the template from that data
 * - submit(payloads): sends the ready rows; resolves to the useCatchQuery result, or null if cancelled
 * - onFinished(importData, { success, message }): shows the results (rows skipped here included)
 * - retryNote: how to re-import after fixing (differs: items refuse duplicates, stock rows would add again)
 */
export default function BulkImportFlow({
   noun,
   columns,
   validate,
   refsReady,
   downloadTemplate,
   submit,
   onFinished,
   onClose,
   retryNote,
}) {
   const inputRef = useRef(null);
   const [file, setFile] = useState(null);
   const [checked, setChecked] = useState(null); // { rows }
   const [fileError, setFileError] = useState(null);
   const [reading, setReading] = useState(false);
   const [downloading, setDownloading] = useState(false);
   const [importing, setImporting] = useState(false);
   const [dragging, setDragging] = useState(false);
   const [onlyIssues, setOnlyIssues] = useState(false);

   const rows = useMemo(() => checked?.rows ?? [], [checked]);
   const ready = useMemo(() => rows.filter((r) => !r.errors.length && !r.blockedByGroup), [rows]);
   const problems = rows.length - ready.length;
   const visible = onlyIssues ? rows.filter((r) => r.errors.length || r.blockedByGroup) : rows;

   const reset = () => {
      setFile(null);
      setChecked(null);
      setFileError(null);
      setOnlyIssues(false);
      if (inputRef.current) inputRef.current.value = "";
   };

   const takeFile = async (picked) => {
      if (!picked) return;
      reset();
      const problem = checkFile(picked);
      if (problem) {
         setFileError(problem);
         return;
      }
      setFile(picked);
      setReading(true);
      try {
         const { rows: sheetRows, headers } = await readSheet(picked);
         const missing = missingColumnsMessage(headers, columns);
         if (missing) setFileError(missing);
         else if (!sheetRows.length) setFileError("The first sheet has no rows to import. Fill in the template below its header row.");
         else if (sheetRows.length > MAX_IMPORT_ROWS) {
            setFileError(`This file has ${sheetRows.length.toLocaleString()} rows; the limit is ${MAX_IMPORT_ROWS.toLocaleString()}. Split it into smaller files.`);
         } else {
            const result = validate(sheetRows);
            setChecked(result);
            setOnlyIssues(result.rows.some((r) => r.errors.length || r.blockedByGroup));
         }
      } catch {
         setFileError("This file couldn't be read. Save it as .xlsx from Excel and try again.");
      } finally {
         setReading(false);
      }
   };

   const onDownload = async () => {
      setDownloading(true);
      try {
         await downloadTemplate();
      } finally {
         setDownloading(false);
      }
   };

   const runImport = async () => {
      if (!ready.length) return;
      setImporting(true);
      const res = await submit(ready.map((r) => r.payload));
      setImporting(false);
      if (!res) return; // cancelled at the confirmation: stay on the preview

      // Rows skipped in the preview are reported with the server's results, by spreadsheet row
      const skipped = rows
         .filter((r) => r.errors.length || r.blockedByGroup)
         .map((r) => ({
            row: r.row,
            item_name: r.label,
            variant_name: r.sub,
            error: r.errors.length ? r.errors.join(" ") : "Skipped: another row of this item has a problem.",
         }));
      const server = res?.result?.data ?? {};
      const serverFailed = res?.success
         ? server.failed ?? []
         : (res?.errors ?? []).map((e) => ({ error: typeof e === "string" ? e : e?.message ?? String(e) }));
      const successful = res?.success ? Number(server.summary?.successful ?? 0) : 0;
      const failed = [...skipped, ...serverFailed].sort((a, b) => (a.row ?? 0) - (b.row ?? 0));

      onFinished(
         { failed, summary: { total: rows.length, successful, failed: rows.length - successful } },
         { success: Boolean(res?.success), message: res?.message, requiresApproval: res?.result?.requiresApproval },
      );
   };

   return (
      <div className='flex flex-col gap-4'>
         {/* Step 1: template */}
         <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3'>
            <div className='min-w-0'>
               <p className='text-sm font-semibold text-foreground'>Start from the template</p>
               <p className='text-xs text-neutral-500'>
                  Its dropdowns list your current {noun.refs}, so values can only be picked, not mistyped.
               </p>
            </div>
            <IButton type='button' variant='outline' size='sm' onClick={onDownload} disabled={!refsReady || downloading} loading={downloading}>
               <Download className='size-4' />
               Download template
            </IButton>
         </div>

         {/* Step 2: file */}
         {!file ? (
            <label
               onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
               }}
               onDragLeave={() => setDragging(false)}
               onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  takeFile(e.dataTransfer.files?.[0]);
               }}
               className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
                  dragging ? "border-primary bg-primary/[0.04]" : "border-neutral-300 hover:border-neutral-400",
               )}
            >
               <FileSpreadsheet className='size-8 text-neutral-500' aria-hidden='true' />
               <span className='text-sm font-semibold text-foreground'>Drop the filled-in template here, or click to choose it</span>
               <span className='text-xs text-neutral-500'>.xlsx, .xls or .csv · up to 5 MB · up to {MAX_IMPORT_ROWS.toLocaleString()} rows</span>
               <input
                  ref={inputRef}
                  type='file'
                  accept={ACCEPTED_EXTENSIONS.join(",")}
                  className='sr-only'
                  onChange={(e) => takeFile(e.target.files?.[0])}
               />
            </label>
         ) : (
            <div className='flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3'>
               <div className='flex min-w-0 items-center gap-3'>
                  <FileSpreadsheet className='size-6 shrink-0 text-neutral-500' aria-hidden='true' />
                  <div className='min-w-0'>
                     <p className='truncate text-sm font-semibold text-foreground'>{file.name}</p>
                     <p className='text-xs text-neutral-500 tabular-nums'>
                        {reading ? "Checking every row…" : checked ? plural(rows.length, "row") : "Couldn't be imported"}
                     </p>
                  </div>
               </div>
               <button
                  type='button'
                  onClick={reset}
                  aria-label='Remove file'
                  className='flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-foreground'
               >
                  <X className='size-4' />
               </button>
            </div>
         )}

         {fileError && (
            <p role='alert' className='rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800'>
               {fileError}
            </p>
         )}

         {reading && (
            <p className='flex items-center gap-2 text-sm text-neutral-500'>
               <Loader2 className='size-4 animate-spin' /> Reading the file…
            </p>
         )}

         {/* Step 3: preview */}
         {checked && (
            <section className='flex flex-col gap-3'>
               <div className='flex flex-wrap items-center justify-between gap-3'>
                  <p className='text-sm text-foreground'>
                     <span className='font-semibold tabular-nums'>{plural(ready.length, "row")}</span> ready
                     {problems > 0 && (
                        <>
                           {" · "}
                           <span className='font-semibold text-red-700 tabular-nums'>{plural(problems, "row")}</span>
                           <span className='text-red-700'> with problems</span>
                        </>
                     )}
                  </p>
                  {problems > 0 && (
                     <label className='inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-neutral-600'>
                        <input type='checkbox' checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} className='accent-primary' />
                        Show only problems
                     </label>
                  )}
               </div>

               <ScrollArea className='max-h-[40vh] rounded-xl border border-neutral-200'>
                  <ul className='divide-y divide-neutral-100'>
                     {visible.map((r) => (
                        <li key={r.row} className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 px-4 py-2.5'>
                           <span className='text-xs font-medium text-neutral-500 tabular-nums'>Row {r.row}</span>
                           <div className='flex min-w-0 flex-col gap-1'>
                              <p className='truncate text-sm font-medium text-foreground'>
                                 {r.label}
                                 {r.sub && <span className='font-medium text-neutral-500'> · {r.sub}</span>}
                              </p>
                              <RowStatus row={r} />
                           </div>
                        </li>
                     ))}
                  </ul>
               </ScrollArea>

               {problems > 0 && (
                  <p className='text-xs text-neutral-500'>
                     Rows with problems are skipped. {retryNote}
                  </p>
               )}
            </section>
         )}

         <footer className='-mx-3 mt-1 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
            <IButtonConfirm
               title='Discard this import?'
               message='Nothing from the file has been saved yet.'
               cancelLabel='Keep going'
               confirmLabel='Discard'
               asButton
               onConfirm={onClose}
               isDirty={Boolean(file)}
            >
               Cancel
            </IButtonConfirm>
            <IButton type='button' onClick={runImport} disabled={!ready.length || importing || reading} loading={importing}>
               <Upload className='size-4' />
               {ready.length ? `Import ${plural(ready.length, noun.one, noun.many)}` : "Import"}
            </IButton>
         </footer>
      </div>
   );
}
