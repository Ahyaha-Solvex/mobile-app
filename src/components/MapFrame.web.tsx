import React from "react";

/** Web build of MapFrame.
 *  react-native-webview only ships a stub on web ("does not support this
 *  platform"), so the generated Leaflet HTML is rendered in a plain iframe.
 *  Metro resolves this file instead of MapFrame.tsx on the web platform. */
type IframeProps = {
  srcDoc: string;
  title: string;
  style: React.CSSProperties;
};

const Iframe = "iframe" as unknown as React.FC<IframeProps>;

export default function MapFrame({ html }: { html: string }) {
  return (
    <Iframe
      srcDoc={html}
      title="Safety map"
      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
    />
  );
}
