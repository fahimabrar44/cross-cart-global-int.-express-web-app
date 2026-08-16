"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { getConsent } from "@/lib/visitor";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "26093014930391502";
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "";
const LINKEDIN_PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID || "";
const PINTEREST_TAG_ID = process.env.NEXT_PUBLIC_PINTEREST_TAG_ID || "";
const TWITTER_PIXEL_ID = process.env.NEXT_PUBLIC_TWITTER_PIXEL_ID || "";

export default function MarketingPixels() {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const update = () => setGranted(Boolean(getConsent()?.marketing));
    update();
    const onConsent = () => update();
    window.addEventListener("ccg-consent-set", onConsent);
    return () => window.removeEventListener("ccg-consent-set", onConsent);
  }, []);

  // Only load marketing/advertising pixels after the visitor opts in.
  if (!granted) return null;

  return (
    <>
      {META_PIXEL_ID && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}

      {TIKTOK_PIXEL_ID && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','open','load'];ttq.factory=function(c){return function(){var i=Array.prototype.slice.call(arguments);i.unshift(c);ttq.push(i);return ttq;};};for(var i=0;i<ttq.methods.length;i++){var m=ttq.methods[i];ttq[m]=ttq.factory(m);}ttq.load=function(id){ttq._i=ttq._i||{};ttq._i[id]={};ttq._i[id]._u='https://analytics.tiktok.com/i18n/event.js';var s=d.createElement('script');s.async=!0;s.src='https://analytics.tiktok.com/i18n/event.js?eventsInstanceId='+id;var f=d.getElementsByTagName('script')[0];f.parentNode.insertBefore(s,f);};ttq.load('${TIKTOK_PIXEL_ID}');ttq.page();`}
        </Script>
      )}

      {LINKEDIN_PARTNER_ID && (
        <Script id="linkedin-insight" strategy="afterInteractive">
          {`_linkedin_partner_id="${LINKEDIN_PARTNER_ID}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(window._linkedin_partner_id);(function(){var s=document.getElementsByTagName('script')[0];var b=document.createElement('script');b.type='text/javascript';b.async=true;b.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';s.parentNode.insertBefore(b,s);})();`}
        </Script>
      )}

      {PINTEREST_TAG_ID && (
        <Script id="pinterest-tag" strategy="afterInteractive">
          {`!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version='3.0';var t=e.createElement('script');t.async=!0,t.src=e.location.protocol+'//s.pinimg.com/ct/core.js';var r=e.getElementsByTagName('script')[0];r.parentNode.insertBefore(t,r);}}(window,document);pintrk('load','${PINTEREST_TAG_ID}');pintrk('page');`}
        </Script>
      )}

      {TWITTER_PIXEL_ID && (
        <Script id="twitter-pixel" strategy="afterInteractive">
          {`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s);s.queue.push(arguments);},s.version='1.1',s.queue=[]);u=t.createElement(n);u.async=!0;u.src='https://static.ads-twitter.com/uwt.js';a=t.getElementsByTagName(n)[0];a.parentNode.insertBefore(u,a);twq('config','${TWITTER_PIXEL_ID}');`}
        </Script>
      )}
    </>
  );
}
