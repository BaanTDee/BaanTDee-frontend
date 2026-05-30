// Payment method icons — bank icons use official app icons from Google Play
// Card brand icons use Iconify (logos: collection) for professional appearance

import React from "react";
import { Icon } from "@iconify/react";

// ── Thai bank app icons (PNG from Play Store — no Iconify equivalent) ─────────

export function KBankIcon() {
  return <img src="/icons/banks/kbank.png?v=2" alt="KBank" className="h-full w-full object-cover" />;
}

export function SCBIcon() {
  return <img src="/icons/banks/scb.png" alt="SCB" className="h-full w-full object-cover" />;
}

export function KTBIcon() {
  return <img src="/icons/banks/ktb.png" alt="KTB" className="h-full w-full object-cover" />;
}

export function KrungsriIcon() {
  return <img src="/icons/banks/krungsri.png" alt="Krungsri" className="h-full w-full object-cover" />;
}

export function BBLIcon() {
  return <img src="/icons/banks/bbl.png" alt="BBL" className="h-full w-full object-cover" />;
}

export function TrueMoneyIcon() {
  return <img src="/icons/banks/truemoney.png" alt="TrueMoney" className="h-full w-full object-cover" />;
}

// ── Card brand icons (Iconify logos: collection) ───────────────────────────────

export function VisaBrandIcon() {
  return <Icon icon="logos:visa" className="h-full w-full" />;
}

export function MastercardBrandIcon() {
  return <Icon icon="logos:mastercard" className="h-full w-full" />;
}

export function AmexBrandIcon() {
  return <Icon icon="logos:amex" className="h-full w-full" />;
}

export function JCBBrandIcon() {
  return <Icon icon="logos:jcb" className="h-full w-full" />;
}

// ── Generic card icon (used as card method icon in accordion) ─────────────────

export function CardIcon() {
  return <Icon icon="logos:mastercard" className="h-full w-full" />;
}

// ── PromptPay / Thai QR Payment icon (custom SVG — no Iconify equivalent) ─────

export function PromptPayIcon() {
  return <img src="/icons/banks/promptpay.png" alt="พร้อมเพย์" className="h-full w-full object-cover" />;
}

// ── Payment method icon map ───────────────────────────────────────────────────

export const PAYMENT_ICONS: Record<string, () => React.JSX.Element> = {
  card: CardIcon,
  promptpay: PromptPayIcon,
  truemoney: TrueMoneyIcon,
  mobile_banking_kbank: KBankIcon,
  mobile_banking_scb: SCBIcon,
  mobile_banking_ktb: KTBIcon,
  mobile_banking_bay: KrungsriIcon,
  internet_banking_bbl: BBLIcon,
  internet_banking_scb: SCBIcon,
  internet_banking_ktb: KTBIcon,
  internet_banking_bay: KrungsriIcon,
};

// ── Card brand detection ──────────────────────────────────────────────────────

export type CardBrand = "visa" | "mastercard" | "amex" | "jcb" | null;

export function detectCardBrand(number: string): CardBrand {
  const n = number.replace(/\s/g, "");
  if (n.length < 1) return null;
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^35[2-8]/.test(n)) return "jcb";
  return null;
}

export const CARD_BRAND_ICONS: Record<NonNullable<CardBrand>, () => React.JSX.Element> = {
  visa: VisaBrandIcon,
  mastercard: MastercardBrandIcon,
  amex: AmexBrandIcon,
  jcb: JCBBrandIcon,
};
