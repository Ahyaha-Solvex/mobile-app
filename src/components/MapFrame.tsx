import React from "react";
import { WebView } from "react-native-webview";

/** In-app browser frame that renders the generated Leaflet HTML.
 *  Native: real react-native-webview.
 *  Web: this file is swapped for `MapFrame.web.tsx` (WebView is a non-functional
 *  stub on web — it renders "does not support this platform"). */
export default function MapFrame({ html }: { html: string }) {
  return <WebView source={{ html }} style={{ flex: 1 }} />;
}
