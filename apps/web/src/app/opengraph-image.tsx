import { ImageResponse } from "next/og";

/**
 * Social share card (LinkedIn, Slack, X…), generated at build time from the
 * design-system tokens rather than a checked-in PNG, so it never drifts from
 * the brand. Next wires the og:image / twitter:image tags automatically.
 *
 * Note: `proxy.ts` must let this route through unauthenticated — crawlers
 * fetch it without a session cookie.
 */

export const alt = "PetHealth — the digital health record for your pets";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Design-system tokens (see globals.css).
const GREEN_600 = "#16704A";
const GREEN_100 = "#D2EDDF";
const CORAL_500 = "#EC7A56";
const STONE_50 = "#FBFAF7";
const STONE_500 = "#8A938D";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: STONE_50,
          padding: "0 96px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              backgroundColor: GREEN_100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Brand mark, kept in sync with public/brand/logo-mark.svg. */}
            <svg width="56" height="56" viewBox="0 0 120 120" fill="none">
              <circle cx="38" cy="36" r="11" fill={GREEN_600} />
              <circle cx="68" cy="28" r="11.5" fill={GREEN_600} />
              <circle cx="95" cy="44" r="10" fill={GREEN_600} />
              <path
                d="M60 99.5C60 99.5 30 80.8 30 60.6c0-10.2 7.9-17.1 16.7-17.1 6 0 10.6 3.3 13.3 7.9 2.7-4.6 7.3-7.9 13.3-7.9C82.1 43.5 90 50.4 90 60.6 90 80.8 60 99.5 60 99.5Z"
                fill={GREEN_600}
              />
            </svg>
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: GREEN_600 }}>
            PetHealth
          </div>
        </div>

        <div
          style={{
            marginTop: 48,
            fontSize: 78,
            lineHeight: 1.1,
            color: "#08291C",
            maxWidth: 900,
          }}
        >
          The digital health record for your pets.
        </div>

        <div style={{ marginTop: 36, fontSize: 34, color: STONE_500 }}>
          Scan documents · Store them in your own Google Drive · Share with your
          household
        </div>

        <div
          style={{
            marginTop: 56,
            width: 160,
            height: 10,
            borderRadius: 999,
            backgroundColor: CORAL_500,
          }}
        />
      </div>
    ),
    size,
  );
}
