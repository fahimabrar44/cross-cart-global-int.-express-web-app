import type { Metadata } from "next";
import PageHeader from "@/utilities/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Braces,
  KeyRound,
  Link2,
  ShieldCheck,
  Truck,
  Calculator,
  Webhook,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "API Integration",
  description:
    "Integrate CrossCart Global International Express shipping APIs into your website, app or system. Track shipments and calculate delivery prices with a simple REST API and your own API key.",
  keywords: [
    "shipping API Bangladesh",
    "courier API integration",
    "shipment tracking API",
    "price calculation API",
    "CrossCart shipping API",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/api-integration",
  },
  openGraph: {
    title: "API Integration | Cross Cart Global International Express",
    description:
      "Track shipments and calculate delivery prices with CrossCart shipping REST APIs and your own API key.",
    url: "https://crosscartglobal.com/api-integration",
    siteName: "Cross Cart Global International Express",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/full-logo.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global International Express",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@crosscartglobal",
    creator: "@crosscartglobal",
    title: "API Integration | Cross Cart Global International Express",
    description:
      "Track shipments and calculate delivery prices with CrossCart shipping REST APIs and your own API key.",
    images: ["/full-logo.png", "/logo.png"],
  },
};

const CodeBlock = ({ code }: { code: string }) => (
  <pre className="overflow-x-auto rounded-lg bg-foreground text-background p-4 text-sm leading-relaxed">
    <code>{code}</code>
  </pre>
);

const ParamTable = ({
  rows,
}: {
  rows: [string, string, string][]; // name, type, description
}) => (
  <div className="overflow-x-auto rounded-lg border">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-muted">
          <th className="text-left p-3 font-semibold">Param</th>
          <th className="text-left p-3 font-semibold">Type</th>
          <th className="text-left p-3 font-semibold">Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, type, description]) => (
          <tr key={name} className="border-b last:border-0">
            <td className="p-3 font-mono">{name}</td>
            <td className="p-3 text-muted-foreground">{type}</td>
            <td className="p-3 text-muted-foreground">{description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ApiIntegrationPage = () => {
  return (
    <div>
      <PageHeader title="API Integration" subtitle="API Integration" />

      <div className="container m-auto py-14 px-4">
        {/* Overview */}
        <div className="max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Integrate CrossCart APIs with your business
          </h2>
          <p className="text-muted-foreground">
            Use your personal API key to access CrossCart Global International
            Express&apos;s tracking and price calculation services directly from
            your own website, app, or system.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              {
                icon: Truck,
                title: "Shipment Tracking",
                text: "Look up the latest status of any shipment by its AWB / tracking number.",
              },
              {
                icon: Calculator,
                title: "Price Calculation",
                text: "Calculate delivery charges between any country and destination zone.",
              },
              {
                icon: Webhook,
                title: "Simple Integration",
                text: "REST endpoints with JSON responses that work with any programming language.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <CardContent className="p-5">
                  <Icon className="h-8 w-8 text-primary mb-3" strokeWidth={1.5} />
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-14 space-y-10 max-w-4xl">
          {/* Getting a key */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <KeyRound className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Step 1: Get your API key
              </h2>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
              <li>
                Sign in to your account and open the{" "}
                <Link href="/dashboard/settings/api-config-and-access" className="text-primary font-medium hover:underline">
                  dashboard API settings
                </Link>
                .
              </li>
              <li>Click “Create Config” and give it a name (e.g. “My Store”).</li>
              <li>
                Your API key is generated automatically and shown only once —
                copy it immediately.
              </li>
              <li>
                You can generate multiple keys, or regenerate / delete a key at
                any time.
              </li>
            </ol>
          </section>

          {/* Authentication */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Step 2: Authenticate with your key
              </h2>
            </div>
            <p className="text-muted-foreground">
              Send your API key in the <code className="font-mono">X-API-Key</code>{" "}
              header on every request. Your key starts with{" "}
              <code className="font-mono">ccg_</code>.
            </p>
            <CodeBlock
              code={`X-API-Key: ccg_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`}
            />
            <p className="text-muted-foreground text-sm">
              Without a key you can still access the public website tools; with
              a key you get rate-limited, logged access suitable for
              production integrations.
            </p>
          </section>

          {/* Base URL */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <Link2 className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Base URLs
              </h2>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Public tracking (external websites / resellers):
              </p>
              <CodeBlock code={`https://crosscartglobal.com/api`} />
              <p className="text-muted-foreground">
                Core services (prices, countries, zones, admin APIs):
              </p>
              <CodeBlock code={`https://crosscartglobal.com/api/v1`} />
            </div>
          </section>

          {/* Endpoints */}
          <section className="space-y-6">
            <div className="flex items-center space-x-2">
              <Braces className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Endpoints
              </h2>
            </div>

            {/* Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Badge variant="default">GET</Badge>
                  <code className="font-mono text-sm">/track/{`{trackID}`}</code>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Public tracking endpoint for your website. Requires your API
                  key and returns the shipment&apos;s receiver, sender and full
                  tracking history in a clean shape.
                </p>
                <CodeBlock
                  code={`curl -X GET "https://crosscartglobal.com/api/track/CROSS00123" \\
  -H "X-API-Key: ccg_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"`}
                />
                <div>
                  <p className="text-sm font-medium mb-2">Response</p>
                  <CodeBlock
                    code={`{
  "success": true,
  "message": "Track fetched successfully",
  "data": {
    "trackId": "CROSS00123",
    "orderId": "66f0c2a1b3d4e5f6a7b8c9d0",
    "receiver": {
      "name": "John Doe",
      "country": "Germany"
    },
    "sender": {
      "name": "CrossCart Global",
      "city": "Dhaka",
      "country": "Bangladesh"
    },
    "currentStatus": "in-transit",
    "history": [
      {
        "status": "in-transit",
        "description": "Shipment picked up",
        "location": { "city": "Dhaka", "country": "Bangladesh" },
        "timestamp": "2026-08-10T09:00:00.000Z"
      }
    ]
  }
}`}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  You can also pass a carrier tracking number (e.g. a DHL,
                  FedEx or Aramex AWB) — the router resolves it to the linked
                  order automatically.
                </p>
              </CardContent>
            </Card>

            {/* Countries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Badge variant="default">GET</Badge>
                  <code className="font-mono text-sm">/v1/countrys</code>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  List all supported origin countries. The country{" "}
                  <code className="font-mono">_id</code> is the{" "}
                  <code className="font-mono">fromCountryId</code> you pass to
                  the price calculator.
                </p>
                <CodeBlock
                  code={`curl -X GET "https://crosscartglobal.com/api/v1/countrys" \\
  -H "X-API-Key: ccg_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"`}
                />
                <div>
                  <p className="text-sm font-medium mb-2">Query params</p>
                  <ParamTable
                    rows={[
                      ["search", "string", "Find by name, code, zone or phone code"],
                      ["name", "string", "Filter by exact country name"],
                      ["code", "string", "Filter by ISO-2 code (e.g. BD)"],
                      ["zone", "string", "Filter by region (e.g. South Asia)"],
                      ["isActive", "boolean", "true / false"],
                      ["page", "number", "Page number (default 1)"],
                      ["limit", "number", "Per page (default 20)"],
                      ["sortBy", "string", "name, code, zone, createdAt, updatedAt"],
                      ["sortOrder", "string", "asc or desc (default desc)"],
                    ]}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Response</p>
                  <CodeBlock
                    code={`{
  "success": true,
  "message": "Countries fetched successfully",
  "data": [
    {
      "_id": "66f0c2a1b3d4e5f6a7b8c9d0",
      "name": "Bangladesh",
      "code": "BD",
      "phoneCode": "+880",
      "zone": "South Asia",
      "isActive": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Zones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Badge variant="default">GET</Badge>
                  <code className="font-mono text-sm">/v1/zones</code>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  List all destination zones. The zone{" "}
                  <code className="font-mono">_id</code> is the{" "}
                  <code className="font-mono">toZoneId</code> you pass to the
                  price calculator. Each zone lists the countries grouped under
                  it via <code className="font-mono">countryIds</code>.
                </p>
                <CodeBlock
                  code={`curl -X GET "https://crosscartglobal.com/api/v1/zones" \\
  -H "X-API-Key: ccg_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"`}
                />
                <div>
                  <p className="text-sm font-medium mb-2">Response</p>
                  <CodeBlock
                    code={`{
  "success": true,
  "message": "Zones fetched successfully",
  "data": [
    {
      "_id": "66f0c2a1b3d4e5f6a7b8c9d1",
      "name": "EUROPE",
      "code": "EU",
      "description": "Zone covering European destinations",
      "countryIds": [
        { "_id": "...", "name": "Germany", "code": "DE", "isActive": true }
      ],
      "isActive": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
}`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Price List */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Badge variant="default">GET</Badge>
                  <code className="font-mono text-sm">/v1/prices</code>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  List the published price tables. You can filter by origin
                  country and destination (zone or country) using either IDs or
                  names.
                </p>
                <CodeBlock
                  code={`# By IDs
curl -X GET "https://<your-domain>/api/v1/prices?from=66f0c2a1b3d4e5f6a7b8c9d0&to=66f0c2a1b3d4e5f6a7b8c9d1" \\
  -H "X-API-Key: ccg_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"

# By names (destination resolves to a zone first, then a country)
curl -X GET "https://<your-domain>/api/v1/prices?fromName=Bangladesh&toName=EUROPE" \\
  -H "X-API-Key: ccg_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"`}
                />
                <div>
                  <p className="text-sm font-medium mb-2">Query params</p>
                  <ParamTable
                    rows={[
                      ["from", "ObjectId", "Origin country ID"],
                      ["to", "ObjectId", "Destination zone (or country) ID"],
                      ["fromName", "string", "Origin country name (e.g. Bangladesh)"],
                      ["toName", "string", "Destination zone or country name"],
                      ["rateName", "string", "Rate name (e.g. Standard, Economy)"],
                      ["page", "number", "Page number (default 1)"],
                      ["limit", "number", "Per page (default 20, max 200)"],
                    ]}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Response</p>
                  <CodeBlock
                    code={`{
  "success": true,
  "message": "Prices fetched successfully",
  "data": [
    {
      "_id": "66f0c2a1b3d4e5f6a7b8c9d2",
      "from": { "_id": "66f...", "name": "Bangladesh", "code": "BD" },
      "to": { "_id": "66f...", "name": "EUROPE", "code": "EU" },
      "rate": [
        {
          "name": "Standard",
          "fuel": 5,
          "gift": 15,
          "profitPercentage": 10,
          "price": {
            "gm500": 8.5,
            "gm1000": 10,
            "gm1500": 12.5,
            "gm2000": 15,
            "kg6to10": 2.5,
            "kg11to20": 2.2
          }
        }
      ],
      "isActive": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}`}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tier keys: <code className="font-mono">gm500 … gm5500</code>{" "}
                  are flat rates for weights up to that many grams;{" "}
                  <code className="font-mono">kg6to10 … kg501to1000</code> are
                  per-kilogram rates for those weight ranges.
                </p>
              </CardContent>
            </Card> */}

            {/* Price Calculate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Badge variant="default">POST</Badge>
                  <code className="font-mono text-sm">/v1/prices/calculate</code>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Calculate the final shipping price for a parcel. It returns
                  one rate per delivery tier (Standard, Economy, …) with the
                  base and final price already computed for your weight.
                </p>

                <div>
                  <p className="text-sm font-medium mb-2">Workflow</p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                    <li>
                      Call <code className="font-mono">GET /v1/countrys</code> to
                      find the origin country{"'"}s{" "}
                      <code className="font-mono">_id</code> (→{" "}
                      <code className="font-mono">fromCountryId</code>).
                    </li>
                    <li>
                      Call <code className="font-mono">GET /v1/zones</code> to
                      find the destination zone{"'"}s{" "}
                      <code className="font-mono">_id</code> (→{" "}
                      <code className="font-mono">toZoneId</code>).
                    </li>
                    <li>
                      Call <code className="font-mono">POST /v1/prices/calculate</code>{" "}
                      with both IDs plus the parcel weight in grams.
                    </li>
                  </ol>
                </div>

                <CodeBlock
                  code={`curl -X POST "https://crosscartglobal.com/api/v1/prices/calculate" \\
  -H "X-API-Key: ccg_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fromCountryId": "66f0c2a1b3d4e5f6a7b8c9d0",
    "toZoneId": "66f0c2a1b3d4e5f6a7b8c9d1",
    "weight": 1500
  }'`}
                />
                <div>
                  <p className="text-sm font-medium mb-2">Body params</p>
                  <ParamTable
                    rows={[
                      ["fromCountryId", "ObjectId", "Required – origin country ID from /countrys"],
                      ["toZoneId", "ObjectId", "Required – destination zone ID from /zones"],
                      ["weight", "number", "Required – weight in grams (e.g. 1500 = 1.5 kg)"],
                      ["rateName", "string", "Optional – only return one rate (e.g. Standard)"],
                    ]}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Response</p>
                  <CodeBlock
                    code={`{
  "success": true,
  "data": {
    "from": { "_id": "...", "name": "Bangladesh", "code": "BD" },
    "to": { "_id": "...", "name": "EUROPE", "code": "EU" },
    "weight": 1500,
    "tier": "gm1500",
    "tierLabel": "1500 GM",
    "rates": [
      {
        "name": "Standard",
        "profitPercentage": 10,
        "gift": 15,
        "fuel": 5,
        "tier": "gm1500",
        "tierLabel": "1500 GM",
        "basePrice": 12.5,
        "finalPrice": 14.2
      }
    ]
  }
}`}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Errors */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Errors</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="text-left p-3 font-semibold">Code</th>
                    <th className="text-left p-3 font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["400", "Invalid request parameters"],
                    ["401", "Missing or invalid API key"],
                    ["403", "IP address not allowed / forbidden"],
                    ["404", "Tracking number not found"],
                    ["429", "API key rate limit exceeded"],
                    ["500", "Internal server error"],
                  ].map(([code, meaning]) => (
                    <tr key={code} className="border-b last:border-0">
                      <td className="p-3 font-mono">{code}</td>
                      <td className="p-3 text-muted-foreground">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">
              Need help? Contact our{" "}
              <Link href="/contact" className="text-primary hover:underline">
                support team
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ApiIntegrationPage;
