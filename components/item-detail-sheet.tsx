"use client";

import { useState } from "react";
import Image from "next/image";
import { PendingItem, PendingType } from "./deal-card";
import {
  POPaymentTermsSheet,
  PaymentTerm,
} from "./po-payment-terms-sheet";
import { InvoiceDueDateSheet } from "./invoice-due-date-sheet";

/* ---------- HELPERS ---------- */

function formatStage(type: PendingType, paymentStage?: "advance" | "balance") {
  const map: Record<PendingType, string> = {
    quotation: "Quotation to be sent",
    followup: "Quotation to be followed up",
    delivery: "Delivery to be done",
    invoice: "Invoice to be submitted",
    paymentFollowup:
      paymentStage === "advance"
        ? "Advance payment pending"
        : paymentStage === "balance"
        ? "Balance payment pending"
        : "Payment to be followed up",
    completed: "Payment received",
  };
  return map[type];
}

function getNextStage(
  type: PendingType,
  paymentStage?: "advance" | "balance"
): PendingType {
  if (type === "paymentFollowup") {
    if (paymentStage === "advance") return "delivery";
    if (paymentStage === "balance") return "completed";
    return "completed"; // default credit case
  }
  const flow: Record<PendingType, PendingType> = {
    quotation: "followup",
    followup: "delivery", // will be overridden by PO modal
    delivery: "invoice",
    invoice: "paymentFollowup",
    paymentFollowup: "completed",
    completed: "completed",
  };
  return flow[type];
}

function getPreviousStage(type: PendingType): PendingType | null {
  const moveBackMap: Record<PendingType, PendingType | null> = {
    quotation: null, // Cannot go back
    followup: "quotation",
    delivery: "followup",
    invoice: "delivery",
    paymentFollowup: "invoice",
    completed: "paymentFollowup",
  };
  return moveBackMap[type];
}

function getDoneHint(type: PendingType) {
  const map: Partial<Record<PendingType, string>> = {
    quotation: "Mark as done once quotation is sent",
    followup: "Mark as done once PO is received",
    delivery: "Mark as done once delivery is completed",
    invoice: "Mark as done once invoice is submitted",
    paymentFollowup: "Mark as done once payment is received",
  };
  return map[type];
}

function getWhatsAppMessage(type: PendingType) {
  if (type === "followup") {
    return encodeURIComponent(
      "Hello Engineer,\n\nHope you are doing well.\n\nRequesting an update on our submitted quotation.\n\nThank you."
    );
  }

  if (type === "paymentFollowup") {
    return encodeURIComponent(
      "Hello Engineer,\n\nHope you are doing well.\n\nRequesting an update on the payment.\n\nThank you."
    );
  }

  return "";
}

/* ---------- COMPONENT ---------- */

export function ItemDetailSheet({
  item,
  onClose,
  onStatusChange,
  onDelete,
  onMoveBack,
  plan = "free",
}: {
  item: PendingItem | null;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: PendingType,
    paymentStage?: "advance" | "balance",
    invoiceDueDate?: string
  ) => void;
  onDelete: (id: string) => void;
  onMoveBack: (id: string) => void;
  plan?: "free" | "basic";
}) {
  const [showPOPaymentModal, setShowPOPaymentModal] = useState(false);
  const [showInvoiceDueDateModal, setShowInvoiceDueDateModal] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!item) return null;

  const showComms =
    item.pendingType === "followup" ||
    item.pendingType === "paymentFollowup";

  const hasWhatsApp = !!item.whatsapp && item.whatsapp.trim() !== "";
  const whatsappUrl = hasWhatsApp
    ? `https://wa.me/${item.whatsapp!.replace(/[^0-9+]/g, "")}?text=${getWhatsAppMessage(
        item.pendingType
      )}`
    : "";

  const doneHint = getDoneHint(item.pendingType);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
      <div
        className="
          relative w-full max-w-lg mx-auto
          rounded-t-3xl
          bg-gradient-to-b from-slate-900 via-slate-900 to-black
          px-6 pt-4 pb-6
          text-white shadow-2xl
        "
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-3">
          <div className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
        >
          ✕
        </button>

        {/* Context */}
        <div className="space-y-2 mb-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {formatStage(item.pendingType, item.paymentStage)}
          </p>

          <h2 className="text-2xl font-semibold break-words">
            {item.customerName}
          </h2>

          <p className="text-sm text-slate-400">
            Pending for {item.timePending}
          </p>

          {item.rfqNumber && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-400">
                Internal RFQ Reference No.
              </span>
              <br />
              <span className="font-medium">{item.rfqNumber}</span>
            </p>
          )}

          {item.label && (
            <p className="text-sm text-slate-300 mt-1 break-words">
              {item.label}
            </p>
          )}
        </div>

        {/* Call, WhatsApp, and Done buttons in one row */}
        {showComms ? (
          <div className="flex gap-3 mb-3">
            {/* Call button */}
            <a
              href={`tel:${item.whatsapp || ""}`}
              className="
                flex-1 h-14
                rounded-2xl flex items-center justify-center
                bg-white/10 text-white
                backdrop-blur
                shadow-lg
                active:scale-95 transition
                hover:bg-white/15
              "
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>

            {/* WhatsApp button */}
            {hasWhatsApp ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex-1 h-14
                  rounded-2xl flex items-center justify-center
                  bg-[#25D366] text-white
                  shadow-lg
                  active:scale-95 transition
                  hover:bg-[#20ba5a]
                "
              >
                <Image
                  src="/icons/whatsapp.png"
                  alt="WhatsApp"
                  width={20}
                  height={20}
                />
              </a>
            ) : (
              <button
                disabled
                className="
                  flex-1 h-14
                  rounded-2xl flex items-center justify-center
                  bg-white/5 text-slate-400
                  cursor-not-allowed
                  opacity-50
                "
              >
                <Image
                  src="/icons/whatsapp.png"
                  alt="WhatsApp"
                  width={20}
                  height={20}
                  className="opacity-50"
                />
              </button>
            )}

            {/* Done button */}
            <button
              onClick={() => {
                if (item.pendingType === "followup") {
                  // Show PO payment terms modal
                  setShowPOPaymentModal(true);
                } else if (item.pendingType === "invoice") {
                  // Show invoice due date modal
                  setShowInvoiceDueDateModal(true);
                } else {
                  // Normal flow
                  const nextStage = getNextStage(
                    item.pendingType,
                    item.paymentStage
                  );
                  onStatusChange(item.id, nextStage);
                }
              }}
              className="
                flex-1 h-14
                rounded-2xl flex items-center justify-center gap-2
                bg-gradient-to-br from-indigo-500 to-purple-500
                text-white font-semibold text-base
                shadow-lg shadow-indigo-500/25
                active:scale-[0.98] transition-transform
              "
            >
              ✓ Done
            </button>
          </div>
        ) : (
          /* Done button - full width when Call/WhatsApp not shown */
          <button
            onClick={() => {
              if (item.pendingType === "followup") {
                // Show PO payment terms modal
                setShowPOPaymentModal(true);
              } else if (item.pendingType === "invoice") {
                // Show invoice due date modal
                setShowInvoiceDueDateModal(true);
              } else {
                // Normal flow
                const nextStage = getNextStage(
                  item.pendingType,
                  item.paymentStage
                );
                onStatusChange(item.id, nextStage);
              }
            }}
            className="
              w-full h-14
              rounded-2xl flex items-center justify-center gap-2
              bg-gradient-to-br from-indigo-500 to-purple-500
              text-white font-semibold text-base
              shadow-lg shadow-indigo-500/25
              active:scale-[0.98] transition-transform
              mb-3
            "
          >
            ✓ Done
          </button>
        )}

        {/* More Options button */}
        <button
          onClick={() => setShowMoreOptions(!showMoreOptions)}
          className="
            w-full h-11
            rounded-xl flex items-center justify-center gap-2
            bg-white/5 text-slate-300
            font-medium text-sm
            active:scale-95 transition
            mb-3
          "
        >
          ⋯ More Options
        </button>

        {/* More Options menu */}
        {showMoreOptions && (
          <div className="mb-3 space-y-2">
            {/* Move Back */}
            {getPreviousStage(item.pendingType) !== null && (
              <button
                onClick={() => {
                  onMoveBack(item.id);
                  setShowMoreOptions(false);
                }}
                className="
                  w-full h-11
                  rounded-xl flex items-center justify-center gap-2
                  bg-white/5 text-slate-300
                  font-medium text-sm
                  active:scale-95 transition
                "
              >
                ↶ Move Back
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => {
                setShowMoreOptions(false);
                setShowDeleteConfirm(true);
              }}
              className="
                w-full h-11
                rounded-xl flex items-center justify-center gap-2
                bg-transparent text-red-400
                font-medium text-sm
                active:scale-95 transition
                hover:bg-red-500/10
              "
            >
              🗑 Delete
            </button>
          </div>
        )}

        {/* WhatsApp warning */}
        {showComms && !hasWhatsApp && (
          <p className="mt-3 text-[10px] text-slate-500 text-center">
            WhatsApp number not saved
          </p>
        )}

        {/* Hint */}
        {doneHint && (
          <p className="mt-3 text-[10px] text-slate-500 text-center">
            {doneHint}
          </p>
        )}
      </div>

      {/* PO Payment Terms Modal */}
      <POPaymentTermsSheet
        open={showPOPaymentModal}
        onSelect={(term: PaymentTerm) => {
          if (term === "credit") {
            // 100% Credit → move to delivery
            onStatusChange(item.id, "delivery");
          } else if (term === "advance") {
            // 100% Advance → move to paymentFollowup with advance
            onStatusChange(item.id, "paymentFollowup", "advance");
          } else if (term === "partial") {
            // Partial Advance + Balance → move to paymentFollowup with advance
            onStatusChange(item.id, "paymentFollowup", "advance");
          }
        }}
        onClose={() => setShowPOPaymentModal(false)}
      />

      {/* Invoice Due Date Modal */}
      <InvoiceDueDateSheet
        open={showInvoiceDueDateModal}
        onSave={(dueDate) => {
          const nextStage = getNextStage(item.pendingType, item.paymentStage);
          onStatusChange(item.id, nextStage, item.paymentStage, dueDate);
          setShowInvoiceDueDateModal(false);
        }}
        onClose={() => setShowInvoiceDueDateModal(false)}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
            aria-hidden
          />
          <div
            className="relative max-w-sm w-full rounded-3xl bg-gradient-to-b from-slate-900 to-black px-6 py-6 shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white text-center mb-2">
              Delete Task?
            </h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Are you sure you want to delete this task?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="
                  flex-1 h-12
                  rounded-xl flex items-center justify-center
                  bg-white/10 text-white
                  font-medium text-sm
                  active:scale-95 transition
                "
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(item.id);
                  setShowDeleteConfirm(false);
                }}
                className="
                  flex-1 h-12
                  rounded-xl flex items-center justify-center
                  bg-red-500/90 text-white
                  font-medium text-sm
                  active:scale-95 transition
                "
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
