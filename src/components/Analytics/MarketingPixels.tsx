"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getConsent } from "@/lib/visitor";
import { apiService } from "@/services/apiService";
import { setGoogleAdsSendTo } from "@/lib/marketing";

interface PublicConfig {
  metaPixelId: string;
  tiktokPixelId: string;
  linkedinPartnerId: string;
  pinterestTagId: string;
  twitterPixelId: string;
  googleAdsSendTo: string;
}

export default function MarketingPixels() {
  const pathname = usePathname();
  const [granted, setGranted] = useState(false);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const update = () => setGranted(Boolean(getConsent()?.marketing));
    update();
    const onConsent = () => update();
    window.addEventListener("ccg-consent-set", onConsent);
    return () => window.removeEventListener("ccg-consent-set", onConsent);
  }, []);

  useEffect(() => {
    if (!granted) return;
    let active = true;
    apiService
      .get<PublicConfig>("/marketing-config/public")
      .then((res) => {
        if (active && res.success && res.data) {
          setConfig(res.data);
          setGoogleAdsSendTo(res.data.googleAdsSendTo || "");
        }
      })
      .catch(() => {
        /* ignore — pixels stay off if config can't be fetched */
      });
    return () => {
      active = false;
    };
  }, [granted]);

  // Fire a PageView on every client-side route change so the full website is
  // tracked (the init scripts only fire PageView once on first load).
  useEffect(() => {
    if (!granted || !config) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    try {
      if (typeof window.fbq === "function") window.fbq("track", "PageView");
    } catch {
      /* ignore */
    }
    try {
      if (typeof window.ttq?.page === "function") window.ttq.page();
    } catch {
      /* ignore */
    }
    try {
      if (typeof window.pintrk === "function") window.pintrk("page");
    } catch {
      /* ignore */
    }
  }, [pathname, granted, config]);

  // Only load marketing/advertising pixels after consent AND config is ready.
  if (!granted || !config) return null;

  const {
    metaPixelId,
    tiktokPixelId,
    linkedinPartnerId,
    pinterestTagId,
    twitterPixelId,
  } = config;

  return (
    <>
      {metaPixelId && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}

      {tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','open','load'];ttq.factory=function(c){return function(){var i=Array.prototype.slice.call(arguments);i.unshift(c);ttq.push(i);return ttq;};};for(var i=0;i<ttq.methods.length;i++){var m=ttq.methods[i];ttq[m]=ttq.factory(m);}ttq.load=function(id){ttq._i=ttq._i||{};ttq._i[id]={};ttq._i[id]._u='https://analytics.tiktok.com/i18n/event.js';var s=d.createElement('script');s.async=!0;s.src='https://analytics.tiktok.com/i18n/event.js?eventsInstanceId='+id;var f=d.getElementsByTagName('script')[0];f.parentNode.insertBefore(s,f);};ttq.load('${tiktokPixelId}');ttq.page();`}
        </Script>
      )}

      {linkedinPartnerId && (
        <Script id="linkedin-insight" strategy="afterInteractive">
          {`_linkedin_partner_id="${linkedinPartnerId}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(window._linkedin_partner_id);(function(){var s=document.getElementsByTagName('script')[0];var b=document.createElement('script');b.type='text/javascript';b.async=true;b.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';s.parentNode.insertBefore(b,s);})();`}
        </Script>
      )}

      {pinterestTagId && (
        <Script id="pinterest-tag" strategy="afterInteractive">
          {`!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version='3.0';var t=e.createElement('script');t.async=!0,t.src=e.location.protocol+'//s.pinimg.com/ct/core.js';var r=e.getElementsByTagName('script')[0];r.parentNode.insertBefore(t,r);}}(window,document);pintrk('load','${pinterestTagId}');pintrk('page');`}
        </Script>
      )}

      {twitterPixelId && (
        <Script id="twitter-pixel" strategy="afterInteractive">
          {`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[]);u=t.createElement(n);u.async=!0;u.src='https://static.ads-twitter.com/uwt.js';a=t.getElementsByTagName(n)[0];a.parentNode.insertBefore(u,a);twq('config','${twitterPixelId}');`}
        </Script>
      )}
    </>
  );
}
