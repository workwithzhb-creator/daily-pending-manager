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
  plan?: "free" | "basic";
}) {
  const [showPOPaymentModal, setShowPOPaymentModal] = useState(false);
  const [showInvoiceDueDateModal, setShowInvoiceDueDateModal] = useState(false);

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

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {showComms && (
            <>
              {/* Call */}
              <a
                href={`tel:${item.whatsapp || ""}`}
                className="
                  flex-1 min-w-[120px] h-12
                  rounded-2xl flex items-center justify-center gap-2
                  bg-white/10 text-white
                  backdrop-blur font-medium
                  active:scale-95 transition
                "
              >
                📞 Call
              </a>

              {/* WhatsApp - always show for followup and paymentFollowup */}
              {hasWhatsApp ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex-1 min-w-[140px] h-12
                    rounded-2xl flex items-center justify-center gap-2
                    bg-[#25D366] text-white
                    font-medium shadow-lg
                    active:scale-95 transition
                  "
                >
                  <Image
                    src="/icons/whatsapp.png"
                    alt="WhatsApp"
                    width={20}
                    height={20}
                  />
                  WhatsApp
                </a>
              ) : (
                <button
                  disabled
                  className="
                    flex-1 min-w-[140px] h-12
                    rounded-2xl flex items-center justify-center gap-2
                    bg-white/5 text-slate-400
                    font-medium
                    cursor-not-allowed
                  "
                >
                  <Image
                    src="/icons/whatsapp.png"
                    alt="WhatsApp"
                    width={20}
                    height={20}
                    className="opacity-50"
                  />
                  WhatsApp
                </button>
              )}
            </>
          )}

          {/* Done */}
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
              flex-1 min-w-[120px] h-12
              rounded-2xl flex items-center justify-center gap-2
              bg-gradient-to-br from-violet-500 to-purple-600
              text-white font-medium shadow-lg
              active:scale-95 transition
            "
          >
            ✓ Done
          </button>
        </div>

        {/* WhatsApp warning */}
        {showComms && !hasWhatsApp && (
          <p className="mt-4 text-xs text-slate-400 flex items-start gap-2">
            <span className="text-yellow-400">⚠</span>
            WhatsApp number not saved
          </p>
        )}

        {/* Hint */}
        {doneHint && (
          <p className="mt-4 text-xs text-slate-400 flex items-start gap-2">
            <span className="text-yellow-400">★</span>
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
    </div>
  );
}
