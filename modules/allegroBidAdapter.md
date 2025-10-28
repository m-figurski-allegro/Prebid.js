# Overview

**Module Name**: Allegro Bidder Adapter  
**Module Type**: Bidder Adapter  
**Maintainer**: the-bidders@allegro.com
**GVLID**: 1493

# Description

Connects to Allegro's demand sources for banner advertising. This adapter uses the OpenRTB 2.5 protocol with support for extension field conversion to Google DoubleClick proto format.

# Supported Media Types

- Banner

# Configuration

The Allegro adapter supports the following configuration options:

## Global Configuration Parameters

| Name                          | Scope    | Type    | Description                                                                                  | Default                            |
|-------------------------------|----------|---------|----------------------------------------------------------------------------------------------|------------------------------------|
| `allegro.bidderUrl`           | optional | String  | Custom bidder endpoint URL                                                                   | `https://dsp.allegro.com/bid`      |
| `allegro.convertExtensionFields` | optional | Boolean | Enable/disable conversion of OpenRTB extension fields to DoubleClick format                | `true`                             |
| `allegro.triggerImpressionPixel` | optional | Boolean | Enable/disable triggering impression tracking pixels on bid won event                      | `false`                            |

## Configuration Example

```javascript
pbjs.setConfig({
  allegro: {
  bidderUrl: 'https://dsp.allegro.com/bid', // optional
    convertExtensionFields: true, // optional, default is true
    triggerImpressionPixel: true  // optional, default is false
  }
});
```

# AdUnit Configuration Example

## Banner Ads

```javascript
var adUnits = [{
  code: 'banner-ad-div',
  mediaTypes: {
    banner: {
      sizes: [
        [300, 250],
        [728, 90],
        [300, 600]
      ]
    }
  },
  bids: [{
    bidder: 'allegro'
  }]
}];
```

# Features

## Extension Field Conversion

The adapter automatically converts OpenRTB extension fields to Google DoubleClick format, to enable correct json unmarshalling based on proto messages.
When `allegro.convertExtensionFields` is set to `true` (default behavior). This conversion affects the following objects:

- Banner extensions (`banner.ext` → `banner.[com.google.doubleclick.banner_ext]`)
- Impression extensions (`imp.ext` → `imp.[com.google.doubleclick.imp]`)
- App extensions (`app.ext` → `app.[com.google.doubleclick.app]`)
- Site extensions (`site.ext` → `site.[com.google.doubleclick.site]`)
- Publisher extensions (`site.publisher.ext` → `site.publisher.[com.google.doubleclick.publisher]`)
- User extensions (`user.ext` → `user.[com.google.doubleclick.user]`)
- Data extensions (`user.data[].ext` → `user.data[].[com.google.doubleclick.data]`)
- Device extensions (`device.ext` → `device.[com.google.doubleclick.device]`)
- Geo extensions (`device.geo.ext` → `device.geo.[com.google.doubleclick.geo]`)
- Regulations extensions (`regs.ext` → `regs.[com.google.doubleclick.regs]`)
- Source extensions (`source.ext` → `source.[com.google.doubleclick.source]`)
- Bid request extensions (`ext` → `[com.google.doubleclick.bid_request]`)

To disable this conversion:

```javascript
pbjs.setConfig({
  allegro: {
    convertExtensionFields: false
  }
});
```

## Impression Tracking

When `allegro.triggerImpressionPixel` is enabled, the adapter will automatically fire the provided `burl` (billing/impression) tracking URL when a bid wins.

# Technical Details

- **Protocol**: OpenRTB 2.5
- **TTL**: 360 seconds
- **Net Revenue**: true
- **Content Type**: application/json

