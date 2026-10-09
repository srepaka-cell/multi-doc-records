import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  INITIAL_SELECTION,
  LIBRARY,
  PICKER_FOLDERS,
  RECORD_GROUPS,
  RECORD_TYPES,
  nextRecordCode,
} from "./data";
import type { BoxFile, CompoundRecord, FileKind } from "./types";
import recordBadgeIcon from "./assets/record-badge.png";

const CLOSER = "Sandeep Repaka";
const FILES = LIBRARY;

export function App() {
  const [selected, setSelected] = useState<string[]>(INITIAL_SELECTION);
  const [menuOpen, setMenuOpen] = useState(true);
  const [declareOpen, setDeclareOpen] = useState(false);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [typeQuery, setTypeQuery] = useState("");
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [groupFilter, setGroupFilter] = useState(RECORD_GROUPS[0]);
  const [records, setRecords] = useState<CompoundRecord[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [badgeHover, setBadgeHover] = useState<{ fileId: string; top: number; left: number } | null>(null);
  const hideBadgeTimer = useRef<number | null>(null);
  const [openFileId, setOpenFileId] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<"browse" | "review">("browse");
  const [addSelection, setAddSelection] = useState<string[]>([]);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerTab, setPickerTab] = useState<"files" | "recents" | "collections" | "hubs">("files");
  const [pickerFolderId, setPickerFolderId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ recordId: string; fileId: string } | null>(null);
  const [attested, setAttested] = useState(false);
  const [closeNote, setCloseNote] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedFiles = FILES.filter((file) => selected.includes(file.id));
  const recordType = RECORD_TYPES.find((type) => type.id === typeId);
  const visibleTypes = RECORD_TYPES.filter((type) => {
    const inGroup = groupFilter === "All Groups" || type.group === groupFilter;
    const query = typeQuery.trim().toLowerCase();
    const matches =
      query.length === 0 ||
      type.name.toLowerCase().includes(query) ||
      type.code.toLowerCase().includes(query) ||
      type.description.toLowerCase().includes(query);
    return inGroup && matches;
  });
  const openFile = FILES.find((file) => file.id === openFileId) ?? null;
  const openRecord = openFile
    ? records.find((record) => record.fileIds.includes(openFile.id) && record.status !== "closed") ??
      records.find((record) => record.fileIds.includes(openFile.id))
    : undefined;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setDeclareOpen(false);
        setCloseOpen(false);
        setAddOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const declareBlock = useMemo(() => {
    if (selectedFiles.length < 2) {
      return "Select at least two files.";
    }
    const already = selectedFiles.find((file) =>
      records.some((record) => record.status === "open" && record.fileIds.includes(file.id)),
    );
    if (already) {
      const record = records.find(
        (item) => item.status === "open" && item.fileIds.includes(already.id),
      );
      return `${already.name} is already in open record ${record?.code}.`;
    }
    return null;
  }, [records, selectedFiles]);

  function showBadge(fileId: string, anchor: HTMLElement) {
    if (hideBadgeTimer.current) window.clearTimeout(hideBadgeTimer.current);
    const rect = anchor.getBoundingClientRect();
    const width = 300;
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const top = rect.bottom + 8;
    setBadgeHover({ fileId, top, left });
  }

  function hideBadgeSoon() {
    hideBadgeTimer.current = window.setTimeout(() => setBadgeHover(null), 140);
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function openDeclare() {
    setTypeId(null);
    setTypeQuery("");
    setGroupFilter(RECORD_GROUPS[0]);
    setTypeMenuOpen(true);
    setMenuOpen(false);
    setDeclareOpen(true);
  }

  function declare() {
    if (!recordType || declareBlock) {
      setToast(declareBlock ?? "Select a record type.");
      return;
    }
    const record: CompoundRecord = {
      id: `rec-${records.length + 1}`,
      code: nextRecordCode(recordType.prefix, records),
      typeId: recordType.id,
      typeName: recordType.name,
      prefix: recordType.prefix,
      status: "open",
      locked: true,
      declaredAt: new Date().toISOString(),
      closerName: CLOSER,
      fileIds: selectedFiles.map((file) => file.id),
      snapshotFileIds: selectedFiles.map((file) => file.id),
    };
    setRecords((current) => [...current, record]);
    setDeclareOpen(false);
    setMenuOpen(false);
    setSelected([]);
    setToast(`${record.code} is declared and locked. Unlock it to add or remove documents.`);
  }

  function setRecordLocked(recordId: string, locked: boolean) {
    const record = records.find((item) => item.id === recordId);
    if (!record || record.status === "closed") return;
    setRecords((current) =>
      current.map((item) => (item.id === recordId ? { ...item, locked } : item)),
    );
    setToast(
      locked
        ? `${record.code} is locked. Documents cannot be added or removed.`
        : `${record.code} is unlocked. Add or remove documents, then lock it again.`,
    );
  }

  function addDocuments(recordId: string, fileIds: string[]) {
    const record = records.find((item) => item.id === recordId);
    if (!record || record.status === "closed" || record.locked) {
      setToast("Unlock the record before adding documents.");
      return;
    }
    const taken = fileIds.filter((id) => records.some((item) => item.fileIds.includes(id)));
    if (taken.length > 0 || fileIds.length === 0) {
      setToast(fileIds.length === 0 ? "Select at least one document." : "Those documents already belong to a record.");
      return;
    }
    setRecords((current) =>
      current.map((item) =>
        item.id === recordId ? { ...item, fileIds: [...item.fileIds, ...fileIds] } : item,
      ),
    );
    setAddOpen(false);
    setAddSelection([]);
    setSelected([]);
    setToast(
      fileIds.length === 1
        ? `Added 1 document to ${record.code}.`
        : `Added ${fileIds.length} documents to ${record.code}.`,
    );
  }

  function removeDocument(recordId: string, fileId: string) {
    const record = records.find((item) => item.id === recordId);
    const file = FILES.find((item) => item.id === fileId);
    if (!record || !file) return;
    if (record.status === "closed" || record.locked) {
      setToast("Unlock the record before removing documents.");
      return;
    }
    if (record.fileIds.length <= 1) {
      setToast("A compound record has to keep at least one document.");
      return;
    }
    setRecords((current) =>
      current.map((item) =>
        item.id === recordId
          ? { ...item, fileIds: item.fileIds.filter((id) => id !== fileId) }
          : item,
      ),
    );
    setToast(`${file.name} was removed from ${record.code}. The file stays in this folder.`);
  }

  function closeRecord() {
    if (!openRecord || !attested) return;
    const at = new Date().toISOString();
    setRecords((current) =>
      current.map((record) =>
        record.id === openRecord.id
          ? {
              ...record,
              status: "closed",
              finiteStartedAt: at,
              attestation: { name: CLOSER, at, note: closeNote.trim() },
            }
          : record,
      ),
    );
    setCloseOpen(false);
    setAttested(false);
    setCloseNote("");
    setToast(`${openRecord.code} is closed. Membership is frozen and the finite clock has started.`);
  }

  return (
    <div className="app">
      <aside className="nav">
        <div className="wordmark">box</div>
        <nav className="nav-list">
          <NavItem id="files" label="Files" active icon="files" />
          <NavItem id="ai" label="AI" icon="ai" />
          <NavItem id="notes" label="Notes" icon="notes" />
          <NavItem id="sign" label="Sign" icon="sign" />
          <NavItem id="automate" label="Automate" icon="bolt" />
          <NavItem id="apps" label="Apps" icon="grid" />
          <NavItem id="integrations" label="Integrations" icon="puzzle" />
          <NavItem id="more" label="More" icon="dots" />
        </nav>
        <div className="nav-bottom">
          <NavItem id="collections" label="Collections" icon="stack" />
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <label className="search">
            <SearchIcon />
            <input
              data-target-id="TopBar-search"
              placeholder="Ask Box AI or Search"
              aria-label="Ask Box AI or Search"
            />
          </label>
          <div className="top-actions">
            <IconButton id="TopBar-notifications" label="Notifications" badge>
              <BellIcon />
            </IconButton>
            <IconButton id="TopBar-tasks" label="Tasks">
              <CheckIcon />
            </IconButton>
            <span className="avatar" aria-hidden>
              SR
            </span>
          </div>
        </header>

        <div className="content">
          {selected.length > 0 ? (
            <div className="selection-bar">
              <button
                className="clear"
                data-target-id="SelectionBar-clear"
                aria-label="Clear selection"
                onClick={() => {
                  setSelected([]);
                  setMenuOpen(false);
                }}
              >
                ×
              </button>
              <span className="selection-count">
                {selected.length} {selected.length === 1 ? "item is" : "items are"} selected
              </span>
              <div className="selection-actions" ref={menuRef}>
                <IconButton id="SelectionBar-more" label="More actions" pressed={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
                  <DotsIcon />
                </IconButton>
                <IconButton id="SelectionBar-share" label="Share">
                  <ShareIcon />
                </IconButton>
                <IconButton id="SelectionBar-message" label="Message">
                  <MailIcon />
                </IconButton>
                <IconButton id="SelectionBar-move" label="Move or copy">
                  <CopyIcon />
                </IconButton>
                <IconButton id="SelectionBar-trash" label="Trash" onClick={() => setToast("Trash is blocked once a file is in an open record. These files are not in a record yet.")}>
                  <TrashIcon />
                </IconButton>
                {menuOpen && (
                  <div className="action-menu" role="menu">
                    <button
                      role="menuitem"
                      data-target-id="SelectionMenu-addToHub"
                      onClick={() => {
                        setMenuOpen(false);
                        setToast("Add to Hub is unchanged. Use Declare as Compound Record to group the selection.");
                      }}
                    >
                      Add to Hub
                    </button>
                    <button
                      role="menuitem"
                      data-target-id="SelectionMenu-declareCompoundRecord"
                      disabled={Boolean(declareBlock)}
                      onClick={openDeclare}
                    >
                      Declare as Compound Record
                    </button>
                    <MembershipMenuItem
                      selectedIds={selected}
                      records={records}
                      onUnlock={(recordId) => {
                        setMenuOpen(false);
                        setRecordLocked(recordId, false);
                      }}
                      onLock={(recordId) => {
                        setMenuOpen(false);
                        setRecordLocked(recordId, true);
                      }}
                      onAdd={(recordId) => {
                        setMenuOpen(false);
                        addDocuments(recordId, selected);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="folder-bar">
              <h1>All Files</h1>
            </div>
          )}

          <div className="list-wrap">
            <div className="columns" role="row">
              <span>Name</span>
              <span>Updated</span>
              <span>Size</span>
              <span />
            </div>
            <ul className="rows">
              {FILES.filter(
                (file) =>
                  (file.folderId ?? "rm") === "rm" ||
                  records.some((item) => item.fileIds.includes(file.id)),
              ).map((file) => {
                const record = records.find((item) => item.fileIds.includes(file.id));
                const isSelected = selected.includes(file.id);
                return (
                  <li key={file.id} className={isSelected ? "row selected" : "row"}>
                    <FileGlyph kind={file.kind} />
                    <div className="name-cell">
                      <button
                        className="file-name"
                        data-target-id="FileRow-open"
                        onClick={() => setOpenFileId(file.id)}
                      >
                        {file.name}
                      </button>
                      {file.version && <span className="version">{file.version}</span>}
                      {file.comments != null && (
                        <span className="comments" title={`${file.comments} comments`}>
                          <CommentIcon /> {file.comments}
                        </span>
                      )}
                    </div>
                    <span className="updated">
                      {record && (
                        <span
                          className="badge-wrap"
                          onMouseEnter={(event) => showBadge(file.id, event.currentTarget)}
                          onMouseLeave={hideBadgeSoon}
                        >
                          <button
                            className={`record-badge mark ${record.status}`}
                            data-target-id="RecordBadge-openDetails"
                            aria-label={`${record.typeName} record`}
                            onClick={() => setOpenFileId(file.id)}
                          >
                            <img src={recordBadgeIcon} alt="" />
                          </button>
                        </span>
                      )}
                      <PersonIcon />
                      {file.updated} by {file.updatedBy}
                    </span>
                    <span className="size">{file.size}</span>
                    <label className="check">
                      <input
                        type="checkbox"
                        data-target-id="FileRow-select"
                        checked={isSelected}
                        aria-label={`Select ${file.name}`}
                        onChange={() => toggle(file.id)}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          {selected.length > 0 && !openFile && (
            <aside className="selected-rail" aria-hidden>
              <StackIcon />
              <p>{selected.length} Selected</p>
            </aside>
          )}
        </div>
      </div>

      {declareOpen && (
        <div className="scrim" onMouseDown={() => setDeclareOpen(false)}>
          <div
            className="modal declare-modal"
            role="dialog"
            aria-labelledby="declare-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="declare-title">Declare as compound record</h2>
              <button
                className="modal-x"
                data-target-id="DeclareDialog-close"
                aria-label="Close"
                onClick={() => setDeclareOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="modal-lead">
              Record types defined by your administrator can be used to declare content and apply
              governance policies.{" "}
              <button className="text-link" data-target-id="DeclareDialog-learnMore" type="button">
                Learn more
              </button>
            </p>
            <div className="type-label">Record Type</div>
            <div className="type-row">
              <select
                data-target-id="DeclareDialog-recordGroup"
                aria-label="Record group"
                value={groupFilter}
                onChange={(event) => {
                  setGroupFilter(event.target.value);
                  setTypeMenuOpen(true);
                }}
              >
                {RECORD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              <div className="type-search">
                <input
                  data-target-id="DeclareDialog-recordTypeSearch"
                  aria-label="Select record type"
                  placeholder="Select Record Type"
                  value={typeMenuOpen ? typeQuery : (recordType?.name ?? "")}
                  onFocus={() => {
                    setTypeQuery("");
                    setTypeMenuOpen(true);
                  }}
                  onChange={(event) => {
                    setTypeQuery(event.target.value);
                    setTypeId(null);
                    setTypeMenuOpen(true);
                  }}
                />
                {typeMenuOpen && (
                  <ul className="type-menu" role="listbox">
                    {visibleTypes.map((type) => (
                      <li key={type.id}>
                        <button
                          type="button"
                          role="option"
                          data-target-id="DeclareDialog-recordTypeOption"
                          aria-selected={type.id === typeId}
                          onClick={() => {
                            setTypeId(type.id);
                            setTypeQuery("");
                            setTypeMenuOpen(false);
                          }}
                        >
                          <DocIcon />
                          <span>
                            <span className="type-name">
                              {type.name} <span className="type-code">{type.code}</span>
                            </span>
                            <span className="type-desc">{type.description}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                    {visibleTypes.length === 0 && <li className="type-empty">No matching record types</li>}
                  </ul>
                )}
              </div>
            </div>
            {recordType && !typeMenuOpen && (
              <div className="type-details">
                <div className="notice">
                  <InfoIcon />
                  <p>
                    Once declared as a compound record, these files will be subject to retention
                    policies and restrictions. Some actions may be permanently disabled.
                  </p>
                </div>
                <h3>Description</h3>
                <p>{recordType.description}</p>
                <h3>Record Group</h3>
                <p>{recordType.group}</p>
                <h3>Retention Policy</h3>
                <p>{recordType.retention}</p>
              </div>
            )}
            {declareBlock && <p className="form-error">{declareBlock}</p>}
            <div className="modal-actions">
              <button className="pill" data-target-id="DeclareDialog-cancel" onClick={() => setDeclareOpen(false)}>
                Cancel
              </button>
              <button
                className="primary pill"
                data-target-id="DeclareDialog-apply"
                disabled={!recordType || Boolean(declareBlock)}
                onClick={declare}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {openFile && (
          <section className="preview" aria-label={openFile.name}>
            <header className="preview-bar">
              <button
                className="preview-close"
                data-target-id="Preview-back"
                aria-label="Back to files"
                onClick={() => setOpenFileId(null)}
              >
                <BackIcon />
              </button>
              <FileGlyph kind={openFile.kind} />
              <div className="preview-title">
                <div className="preview-name-row">
                  <h2>{openFile.name}</h2>
                  {openFile.version && <span className="version">{openFile.version}</span>}
                  {openRecord && (
                    <span
                      className="badge-wrap"
                      onMouseEnter={(event) => showBadge(openFile.id, event.currentTarget)}
                      onMouseLeave={hideBadgeSoon}
                    >
                      <button className="record-chip" data-target-id="Preview-recordBadge" type="button">
                        <DocIcon />
                        RECORD
                      </button>
                      <span className={openRecord.locked ? "lock-pill locked" : "lock-pill unlocked"}>
                        {openRecord.locked ? "Locked" : "Unlocked"}
                      </span>
                    </span>
                  )}
                </div>
                <p className="preview-folder">
                  All Files · Updated {openFile.updated} by {openFile.updatedBy}
                </p>
              </div>
            </header>
            <div className="preview-body">
              <div className="page">
                <FileGlyph kind={openFile.kind} />
                <p>{openFile.name}</p>
                <p className="muted">
                  {openFile.updated} · {openFile.size}
                  {openRecord?.status === "closed" ? " · version frozen at close" : ""}
                </p>
              </div>
              <aside className="details">
                <h3 className="details-heading">Details</h3>
                {openRecord ? (
                  <RecordDetails
                    record={openRecord}
                    fileId={openFile.id}
                    onUnlock={() => setRecordLocked(openRecord.id, false)}
                    onLock={() => setRecordLocked(openRecord.id, true)}
                    onRemove={(fileId) => setRemoveTarget({ recordId: openRecord.id, fileId })}
                    onAdd={() => {
                      setAddSelection([]);
                      setAddStep("browse");
                      setPickerQuery("");
                      setPickerTab("files");
                      setPickerFolderId(null);
                      setAddOpen(true);
                    }}
                    onClose={() => {
                      setAttested(false);
                      setCloseNote("");
                      setCloseOpen(true);
                    }}
                  />
                ) : (
                  <p className="muted">This file is not part of a compound record.</p>
                )}
              </aside>
            </div>
          </section>
      )}

      {addOpen && openRecord && (
        <AddDocumentsDialog
          record={openRecord}
          records={records}
          step={addStep}
          selectedIds={addSelection}
          query={pickerQuery}
          tab={pickerTab}
          folderId={pickerFolderId}
          onQuery={setPickerQuery}
          onTab={setPickerTab}
          onOpenFolder={setPickerFolderId}
          onToggle={(id) =>
            setAddSelection((current) =>
              current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
            )
          }
          onReview={() => setAddStep("review")}
          onBack={() => setAddStep("browse")}
          onCancel={() => setAddOpen(false)}
          onApply={() => addDocuments(openRecord.id, addSelection)}
        />
      )}

      {removeTarget && (
        <RemoveConfirmDialog
          record={records.find((item) => item.id === removeTarget.recordId)}
          file={FILES.find((item) => item.id === removeTarget.fileId)}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => {
            removeDocument(removeTarget.recordId, removeTarget.fileId);
            setRemoveTarget(null);
          }}
        />
      )}

      {closeOpen && openRecord && (
        <div className="scrim" onMouseDown={() => setCloseOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-labelledby="close-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="close-title">Close {openRecord.code}</h2>
            <p className="modal-lead">
              {openRecord.fileIds.length} active files. Close freezes the current version of each
              file and starts finite retention.
            </p>
            <label className="attest">
              <input
                type="checkbox"
                data-target-id="CloseDialog-attest"
                checked={attested}
                onChange={(event) => setAttested(event.target.checked)}
              />
              <span>
                I certify that this record is complete and that all required documents have been
                included or accounted for. I understand that this certification is immutable and
                will be visible to auditors.
              </span>
            </label>
            <label className="field">
              Close note
              <textarea
                data-target-id="CloseDialog-note"
                maxLength={500}
                value={closeNote}
                onChange={(event) => setCloseNote(event.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button data-target-id="CloseDialog-cancel" onClick={() => setCloseOpen(false)}>
                Cancel
              </button>
              <button
                className="primary"
                data-target-id="CloseDialog-confirm"
                disabled={!attested}
                onClick={closeRecord}
              >
                Close record
              </button>
            </div>
          </div>
        </div>
      )}

      {badgeHover && (
        <BadgeHover
          fileId={badgeHover.fileId}
          top={badgeHover.top}
          left={badgeHover.left}
          records={records}
          onEnter={() => {
            if (hideBadgeTimer.current) window.clearTimeout(hideBadgeTimer.current);
          }}
          onLeave={hideBadgeSoon}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function MembershipMenuItem({
  selectedIds,
  records,
  onUnlock,
  onLock,
  onAdd,
}: {
  selectedIds: string[];
  records: CompoundRecord[];
  onUnlock: (recordId: string) => void;
  onLock: (recordId: string) => void;
  onAdd: (recordId: string) => void;
}) {
  const memberRecords = records.filter((record) =>
    selectedIds.some((id) => record.fileIds.includes(id)),
  );
  const shared = memberRecords.length === 1 ? memberRecords[0] : undefined;
  const allInShared =
    shared != null && selectedIds.every((id) => shared.fileIds.includes(id));
  const unlocked = records.find((record) => record.status === "open" && !record.locked);
  const selectionIsFree = selectedIds.every(
    (id) => !records.some((record) => record.fileIds.includes(id)),
  );

  if (shared && allInShared && shared.status === "open") {
    return shared.locked ? (
      <button role="menuitem" data-target-id="SelectionMenu-unlockRecord" onClick={() => onUnlock(shared.id)}>
        Unlock record
      </button>
    ) : (
      <button role="menuitem" data-target-id="SelectionMenu-lockRecord" onClick={() => onLock(shared.id)}>
        Lock record
      </button>
    );
  }

  if (unlocked && selectionIsFree) {
    return (
      <button role="menuitem" data-target-id="SelectionMenu-addToRecord" onClick={() => onAdd(unlocked.id)}>
        Add to {unlocked.code}
      </button>
    );
  }

  return null;
}

function eligibleFiles(records: CompoundRecord[]) {
  return FILES.filter((file) => !records.some((item) => item.fileIds.includes(file.id)));
}

function AddDocumentsDialog({
  record,
  records,
  step,
  selectedIds,
  query,
  tab,
  folderId,
  onQuery,
  onTab,
  onOpenFolder,
  onToggle,
  onReview,
  onBack,
  onCancel,
  onApply,
}: {
  record: CompoundRecord;
  records: CompoundRecord[];
  step: "browse" | "review";
  selectedIds: string[];
  query: string;
  tab: "files" | "recents" | "collections" | "hubs";
  folderId: string | null;
  onQuery: (value: string) => void;
  onTab: (tab: "files" | "recents" | "collections" | "hubs") => void;
  onOpenFolder: (id: string | null) => void;
  onToggle: (id: string) => void;
  onReview: () => void;
  onBack: () => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const available = eligibleFiles(records);
  const chosen = FILES.filter((file) => selectedIds.includes(file.id));
  const needle = query.trim().toLowerCase();
  const folder = PICKER_FOLDERS.find((item) => item.id === folderId) ?? null;

  return (
    <div className="scrim" onMouseDown={onCancel}>
      <div
        className="modal picker-modal"
        role="dialog"
        aria-labelledby="add-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="add-title">{step === "browse" ? "Choose Files and Folders" : "Review selected files"}</h2>
          <button className="modal-x" data-target-id="AddDocuments-close" aria-label="Close" onClick={onCancel}>
            ×
          </button>
        </div>

        {step === "review" ? (
          <>
            <p className="modal-lead">
              These files will be linked into {record.code}. Remove any you do not want to add. Files stay in their
              folders.
            </p>
            {chosen.length === 0 ? (
              <p className="picker-empty">No files selected.</p>
            ) : (
              <ul className="review-list">
                {chosen.map((file) => (
                  <li key={file.id}>
                    <FileGlyph kind={file.kind} />
                    <span className="review-name">{file.name}</span>
                    <button
                      className="text-link"
                      data-target-id="AddDocuments-removeSelected"
                      onClick={() => onToggle(file.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-actions">
              <button className="pill" data-target-id="AddDocuments-back" onClick={onBack}>
                Back
              </button>
              <button
                className="primary pill"
                data-target-id="AddDocuments-apply"
                disabled={chosen.length === 0}
                onClick={onApply}
              >
                Add to record
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="picker-search">
              <SearchIcon />
              <input
                data-target-id="AddDocuments-search"
                value={query}
                placeholder="Search"
                onChange={(event) => onQuery(event.target.value)}
              />
            </label>
            <div className="picker-tabs" role="tablist">
              {(
                [
                  ["files", "Files"],
                  ["recents", "Recents"],
                  ["collections", "Collections"],
                  ["hubs", "Hubs"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  className={tab === id ? "active" : ""}
                  data-target-id={`AddDocuments-tab${label}`}
                  onClick={() => onTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "collections" || tab === "hubs" ? (
              <p className="picker-empty">Nothing in {tab === "collections" ? "Collections" : "Hubs"} yet.</p>
            ) : (
              <PickerList
                available={available}
                selectedIds={selectedIds}
                needle={needle}
                tab={tab}
                folder={folder}
                onOpenFolder={onOpenFolder}
                onToggle={onToggle}
              />
            )}

            <div className="picker-footer">
              <button
                className="primary pill add-selected"
                data-target-id="AddDocuments-review"
                disabled={selectedIds.length === 0}
                onClick={onReview}
              >
                Add Selected
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PickerList({
  available,
  selectedIds,
  needle,
  tab,
  folder,
  onOpenFolder,
  onToggle,
}: {
  available: BoxFile[];
  selectedIds: string[];
  needle: string;
  tab: "files" | "recents";
  folder: { id: string; name: string } | null;
  onOpenFolder: (id: string | null) => void;
  onToggle: (id: string) => void;
}) {
  const searching = needle.length > 0;
  const files = available.filter((file) => {
    if (searching && !file.name.toLowerCase().includes(needle)) return false;
    if (tab === "recents") return file.updated === "Today" || file.updated === "Yesterday";
    if (searching) return true;
    return (file.folderId ?? "rm") === (folder?.id ?? "");
  });
  const folders =
    tab === "files" && !searching && !folder
      ? PICKER_FOLDERS.filter((item) => item.name.toLowerCase().includes(needle) || needle.length === 0)
      : [];

  return (
    <div className="picker-body">
      <div className="picker-heading">
        {folder ? (
          <button className="text-link" data-target-id="AddDocuments-up" onClick={() => onOpenFolder(null)}>
            All Files
          </button>
        ) : (
          <span>All Files</span>
        )}
        {folder && <span className="picker-crumb"> / {folder.name}</span>}
      </div>
      <div className="picker-columns">
        <span>Name</span>
        <span>Updated</span>
      </div>
      <ul className="picker-rows">
        {folders.map((item) => {
          const inside = available.filter((file) => (file.folderId ?? "rm") === item.id);
          const allChecked = inside.length > 0 && inside.every((file) => selectedIds.includes(file.id));
          return (
            <li key={item.id}>
              <button
                className="picker-open"
                data-target-id="AddDocuments-openFolder"
                onClick={() => onOpenFolder(item.id)}
              >
                <FolderGlyph tone={item.tone} />
                <span className="picker-name">{item.name}</span>
              </button>
              <span className="picker-updated">Today by {item.updatedBy}</span>
              <input
                type="checkbox"
                data-target-id="AddDocuments-selectFolder"
                aria-label={`Select files in ${item.name}`}
                disabled={inside.length === 0}
                checked={allChecked}
                onChange={() => {
                  if (allChecked) {
                    inside.forEach((file) => {
                      if (selectedIds.includes(file.id)) onToggle(file.id);
                    });
                  } else {
                    inside.forEach((file) => {
                      if (!selectedIds.includes(file.id)) onToggle(file.id);
                    });
                  }
                }}
              />
            </li>
          );
        })}
        {files.map((file) => (
          <li key={file.id}>
            <span className="picker-open static">
              <FileGlyph kind={file.kind} />
              <span className="picker-name">{file.name}</span>
            </span>
            <span className="picker-updated">
              {file.updated} by {file.updatedBy}
            </span>
            <input
              type="checkbox"
              data-target-id="AddDocuments-select"
              aria-label={`Select ${file.name}`}
              checked={selectedIds.includes(file.id)}
              onChange={() => onToggle(file.id)}
            />
          </li>
        ))}
        {folders.length === 0 && files.length === 0 && <li className="picker-empty-row">No files to add.</li>}
      </ul>
    </div>
  );
}

function RemoveConfirmDialog({
  record,
  file,
  onCancel,
  onConfirm,
}: {
  record?: CompoundRecord;
  file?: BoxFile;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!record || !file) return null;
  return (
    <div className="scrim" onMouseDown={onCancel}>
      <div
        className="modal confirm-modal"
        role="dialog"
        aria-labelledby="remove-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="remove-title">Remove document</h2>
          <button className="modal-x" data-target-id="RemoveDocument-close" aria-label="Close" onClick={onCancel}>
            ×
          </button>
        </div>
        <p className="modal-lead">
          {record.fileIds.length <= 1
            ? "A compound record has to keep at least one document."
            : `Remove ${file.name} from ${record.code}? The file stays in its folder. The declaration snapshot still includes it.`}
        </p>
        <div className="modal-actions">
          <button className="pill" data-target-id="RemoveDocument-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="primary pill"
            data-target-id="RemoveDocument-confirm"
            disabled={record.fileIds.length <= 1}
            onClick={onConfirm}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function FolderGlyph({ tone }: { tone: "blue" | "yellow" }) {
  return (
    <svg className={`folder-glyph ${tone}`} viewBox="0 0 28 24" aria-hidden>
      <path d="M2 6h9l2 2h13v14H2z" />
      {tone === "blue" && (
        <>
          <circle cx="11" cy="14" r="2" />
          <circle cx="17" cy="14" r="2" />
        </>
      )}
    </svg>
  );
}

function RecordDetails({
  record,
  fileId,
  onUnlock,
  onLock,
  onRemove,
  onAdd,
  onClose,
}: {
  record: CompoundRecord;
  fileId: string;
  onUnlock: () => void;
  onLock: () => void;
  onRemove: (fileId: string) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  const type = RECORD_TYPES.find((item) => item.id === record.typeId);
  const file = FILES.find((item) => item.id === fileId);
  const others = FILES.filter((item) => record.fileIds.includes(item.id) && item.id !== fileId);
  if (!type || !file) return null;
  return (
    <>
      <section className="detail-block">
        <h4>Record Details</h4>
        <p className="detail-label">Description</p>
        <p>{type.description}</p>
        <p className="detail-label">Record Group</p>
        <p>{type.group}</p>
        <p className="detail-label">Record Type</p>
        <p>{type.name}</p>
        <p className="detail-label">Retention Policy</p>
        <p>{type.retention}</p>
        <p className="detail-label">Retention length</p>
        <p>{type.retentionLength}</p>
        <p className="detail-label">Restrictions</p>
        <p>Prevent Trashing</p>
        <p>Prevent Editing</p>
        <p>Enhanced Audit Logging</p>
        <p className="detail-label">Compound record</p>
        <p>Part of compound record {record.code}</p>
        <p className="detail-label">Membership</p>
        {record.status === "closed" ? (
          <p>Closed. Documents cannot be added or removed.</p>
        ) : record.locked ? (
          <div className="lock-panel">
            <p>Locked. Unlock this record to add or remove documents.</p>
            <button data-target-id="RecordDetails-unlock" onClick={onUnlock}>
              Unlock record
            </button>
          </div>
        ) : (
          <div className="lock-panel unlocked">
            <p>Unlocked. Add or remove documents, then lock the record. The original declaration stays on the record.</p>
            <div className="lock-actions">
              <button data-target-id="RecordDetails-addDocuments" onClick={onAdd}>
                Add documents
              </button>
              <button className="primary" data-target-id="RecordDetails-lock" onClick={onLock}>
                Lock record
              </button>
            </div>
          </div>
        )}
        <p className="detail-label">Other documents</p>
        <ul className="member-preview">
          {others.map((item) => (
            <li key={item.id} className="member-row">
              <span>{item.name}</span>
              {record.status === "open" && !record.locked && (
                <button data-target-id="RecordDetails-removeDocument" onClick={() => onRemove(item.id)}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {record.status === "open" && !record.locked && (
          <button
            className="text-button"
            data-target-id="RecordDetails-removeCurrent"
            onClick={() => onRemove(fileId)}
          >
            Remove this document from the record
          </button>
        )}
        {record.attestation && (
          <p className="attest-read">
            Record certified complete by {record.attestation.name} on{" "}
            {new Date(record.attestation.at).toLocaleString()}.
            {record.attestation.note ? ` ${record.attestation.note}` : ""}
          </p>
        )}
        {record.status === "open" && (
          <button className="primary block" data-target-id="RecordDetails-close" onClick={onClose}>
            Close record
          </button>
        )}
      </section>
      <section className="detail-block">
        <h4>File Properties</h4>
        <p className="detail-label">Description</p>
        <p className="placeholder">Enter a description</p>
        <p className="detail-label">Owner</p>
        <p>IT at Box</p>
        <p className="detail-label">Uploader</p>
        <p>{file.updatedBy}</p>
        <p className="detail-label">Created</p>
        <p>{file.updated}</p>
      </section>
    </>
  );
}

function BadgeHover({
  fileId,
  top,
  left,
  records,
  onEnter,
  onLeave,
}: {
  fileId: string;
  top: number;
  left: number;
  records: CompoundRecord[];
  onEnter: () => void;
  onLeave: () => void;
}) {
  const record = records.find((item) => item.fileIds.includes(fileId));
  const type = RECORD_TYPES.find((item) => item.id === record?.typeId);
  if (!record || !type) return null;
  const others = FILES.filter((file) => record.fileIds.includes(file.id) && file.id !== fileId);
  return (
    <div
      className="badge-card"
      role="tooltip"
      style={{ top, left }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="badge-title">
        <DocIcon />
        <strong>{type.name}</strong>
      </div>
      <p className="badge-desc">{type.description}</p>
      <p className="compound-flag">Part of compound record {record.code}</p>
      <p className={record.locked ? "lock-line" : "lock-line unlocked"}>
        {record.status === "closed"
          ? "Closed. Documents cannot be added or removed."
          : record.locked
            ? "Locked. Unlock the record to add or remove documents."
            : "Unlocked. Documents can be added or removed until you lock the record."}
      </p>
      <h4>Record Group</h4>
      <p>{type.group}</p>
      <h4>Retention Policy</h4>
      <p>{type.retention}</p>
      <h4>Retention Length</h4>
      <p>{type.retentionLength}</p>
      <h4>Restrictions</h4>
      {type.restrictions.map((restriction) => (
        <p key={restriction}>{restriction}</p>
      ))}
      <h4>Other documents in this record</h4>
      <ul>
        {others.map((file) => (
          <li key={file.id}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
}

function NavItem({
  id,
  label,
  icon,
  active,
}: {
  id: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <button
      className={active ? "nav-item active" : "nav-item"}
      data-target-id={`Nav-${id}`}
      aria-current={active ? "page" : undefined}
    >
      <NavGlyph name={icon} />
      <span>{label}</span>
    </button>
  );
}

function IconButton({
  id,
  label,
  children,
  onClick,
  pressed,
  badge,
}: {
  id: string;
  label: string;
  children: ReactNode;
  onClick?: () => void;
  pressed?: boolean;
  badge?: boolean;
}) {
  return (
    <button
      className={badge ? "icon-btn has-badge" : "icon-btn"}
      data-target-id={id}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function FileGlyph({ kind }: { kind: FileKind }) {
  return (
    <svg className={`glyph ${kind}`} viewBox="0 0 24 28" aria-hidden>
      <path d="M4 1h11l5 5v21H4z" />
      <path className="fold" d="M15 1v5h5" />
      {kind === "docx" && <text x="6" y="20">W</text>}
      {kind === "pptx" && <text x="6" y="20">P</text>}
      {kind === "pdf" && <text x="5" y="20">PDF</text>}
      {kind === "boxnote" && (
        <>
          <path className="line" d="M8 13h8M8 17h8M8 21h5" />
        </>
      )}
    </svg>
  );
}

function NavGlyph({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      {name === "files" && <path d="M4 6h7l2 2h7v10H4z" />}
      {name === "ai" && <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />}
      {name === "notes" && <path d="M6 3h9l3 3v15H6z M8 11h8M8 15h6" />}
      {name === "sign" && <path d="M4 16c3-6 6-6 8-2s4 2 8-4 M4 19h16" />}
      {name === "bolt" && <path d="M13 2L5 14h6l-1 8 9-13h-6z" />}
      {name === "grid" && <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />}
      {name === "puzzle" && <path d="M8 4h4v3a2 2 0 104 0V4h4v6h-3a2 2 0 100 4h3v6H4V4h4z" />}
      {name === "dots" && <path d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth="3" />}
      {name === "stack" && <path d="M4 8l8-4 8 4-8 4z M4 12l8 4 8-4 M4 16l8 4 8-4" />}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4 4" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 16V10a6 6 0 1112 0v6l1 2H5z M10 19a2 2 0 004 0" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="6" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18" cy="12" r="1.4" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="7" cy="12" r="2" />
      <circle cx="17" cy="7" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M9 11l6-3M9 13l6 3" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 6h16v12H4z M4 7l8 6 8-6" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="8" y="8" width="11" height="12" rx="1" />
      <path d="M5 15V5h11" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 7h14 M9 7V5h6v2 M7 7l1 13h8l1-13" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg className="person" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="9" r="3" />
      <path d="M6 18c1.5-3 10.5-3 12 0" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 6h14v9H8l-3 3z" />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M15 5L8 12l7 7" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className="doc-icon" viewBox="0 0 24 24" aria-hidden>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="info-icon" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg viewBox="0 0 64 48" aria-hidden>
      <rect x="14" y="16" width="36" height="24" rx="2" />
      <rect x="10" y="10" width="36" height="24" rx="2" />
      <rect x="6" y="4" width="36" height="24" rx="2" />
    </svg>
  );
}
