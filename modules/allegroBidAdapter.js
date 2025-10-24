// jshint esversion: 6, es3: false, node: true
'use strict';

import {registerBidder} from '../src/adapters/bidderFactory.js';
import {BANNER} from '../src/mediaTypes.js';
import {ortbConverter} from '../libraries/ortbConverter/converter.js';
import {config} from '../src/config.js';
import {triggerPixel} from '../src/utils.js';

const BIDDER_CODE = 'allegro';
const BIDDER_URL = 'https://dsp.allegro.pl/prebid';
const GVLID = 1493;

function convertExtensionFields(request) {
  if (request.imp) {
    request.imp.forEach(imp => {
      if (imp.banner?.ext) {
        const extCopy = {...imp.banner.ext};
        delete imp.banner.ext;
        imp.banner['[com.google.doubleclick.banner_ext]'] = extCopy;
      }
      if (imp.ext) {
        const extCopy = {...imp.ext};
        delete imp.ext;
        imp['[com.google.doubleclick.imp]'] = extCopy;
      }
    });
  }

  if (request.app?.ext) {
    const extCopy = {...request.app.ext};
    delete request.app.ext;
    request.app['[com.google.doubleclick.app]'] = extCopy;
  }

  if (request.site?.ext) {
    const extCopy = {...request.site.ext};
    delete request.site.ext;
    request.site['[com.google.doubleclick.site]'] = extCopy;
  }

  if (request.site?.publisher?.ext) {
    const extCopy = {...request.site.publisher.ext};
    delete request.site.publisher.ext;
    request.site.publisher['[com.google.doubleclick.publisher]'] = extCopy;
  }

  if (request.user?.ext) {
    const extCopy = {...request.user.ext};
    delete request.user.ext;
    request.user['[com.google.doubleclick.user]'] = extCopy;
  }

  if (request.user?.data) {
    request.user.data.forEach(data => {
      if (data.ext) {
        const extCopy = {...data.ext};
        delete data.ext;
        data['[com.google.doubleclick.data]'] = extCopy;
      }
    });
  }

  if (request.device?.ext) {
    const extCopy = {...request.device.ext};
    delete request.device.ext;
    request.device['[com.google.doubleclick.device]'] = extCopy;
  }

  if (request.device?.geo?.ext) {
    const extCopy = {...request.device.geo.ext};
    delete request.device.geo.ext;
    request.device.geo['[com.google.doubleclick.geo]'] = extCopy;
  }

  if (request.regs?.ext) {
    if (request.regs?.ext?.gdpr !== 'undefined') {
      request.regs.ext.gdpr = request.regs.ext.gdpr === 1;
    }

    const extCopy = {...request.regs.ext};
    delete request.regs.ext;
    request.regs['[com.google.doubleclick.regs]'] = extCopy;
  }

  if (request.source?.ext) {
    const extCopy = {...request.source.ext};
    delete request.source.ext;
    request.source['[com.google.doubleclick.source]'] = extCopy;
  }

  if (request.ext) {
    const extCopy = {...request.ext};
    delete request.ext;
    request['[com.google.doubleclick.bid_request]'] = extCopy;
  }
}

const converter = ortbConverter({
  context: {
    mediaType: BANNER,
    ttl: 360,
    netRevenue: true
  },
  imp(buildImp, bidRequest, context) {
    const imp = buildImp(bidRequest, context);
    if (imp?.banner?.topframe !== 'undefined') {
      imp.banner.topframe = imp.banner.topframe === 1;
    }
    if (imp?.secure !== 'undefined') {
      imp.secure = imp.secure === 1;
    }
    return imp;
  },
  request(buildRequest, imps, bidderRequest, context) {
    const request = buildRequest(imps, bidderRequest, context);

    if (request?.device?.dnt !== 'undefined') {
      request.device.dnt = request.device.dnt === 1;
    }

    if (request?.device?.sua?.mobile !== 'undefined') {
      request.device.sua.mobile = request.device.sua.mobile === 1;
    }

    if (request?.test !== 'undefined') {
      request.test = request.test === 1;
    }

    // by default, we convert extension fields unless the config explicitly disables it
    const convertExtConfig = config.getConfig('allegro.convertExtensionFields');
    if (convertExtConfig === undefined || convertExtConfig === true) {
      convertExtensionFields(request);
    }

    return request;
  }
})

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER],
  gvlid: GVLID,

  isBidRequestValid: function () {
    return true
  },

  buildRequests: function (bidRequests, bidderRequest) {
    const url = config.getConfig('allegro.bidderUrl') || BIDDER_URL;

    return {
      method: 'POST',
      url: url,
      data: converter.toORTB({bidderRequest, bidRequests}),
      options: {
        contentType: 'application/json'
      },
    }
  },

  interpretResponse: function (response, request) {
    if (!response.body) return;
    let bids = converter.fromORTB({response: response.body, request: request.data}).bids;
    return bids;
  },

  onBidWon: function (bid) {
    const triggerImpressionPixel = config.getConfig('allegro.triggerImpressionPixel');

    if (triggerImpressionPixel && bid.burl) {
      triggerPixel(replaceMacros(bid.burl, bid));
    }
  }

}

function replaceMacros(url, bid) {
  if (!url) return url;
  return url
    .replace(/\${AUCTION_ID}/g, bid.auctionId || bid.requestId || '')
    .replace(/\${AUCTION_BID_ID}/g, bid.requestId || bid.bidId || '')
    .replace(/\${AUCTION_BID_IMP_ID}/g, bid.impid || bid.impId || bid.adUnitCode || '')
    .replace(/\${AUCTION_SEAT_ID}/g, bid.seat || bid.seatId || '')
    .replace(/\${AUCTION_AD_ID}/g, bid.adId || bid.creativeId || '')
    .replace(/\${AUCTION_PRICE}/g, bid.cpm ?? '') // should we handle macro params? if so it should be encrypted
    .replace(/\${CURRENCY}/g, bid.currency || '')
    .replace(/\${CREATIVE_ID}/g, bid.creativeId || '')
    .replace(/\${ADUNIT_CODE}/g, bid.adUnitCode || '');
}

registerBidder(spec);
