// jshint esversion: 6, es3: false, node: true
'use strict';

import {registerBidder} from '../src/adapters/bidderFactory.js';
import {BANNER, VIDEO, NATIVE} from '../src/mediaTypes.js';
import {ortbConverter} from '../libraries/ortbConverter/converter.js';
import {config} from '../src/config.js';
import {triggerPixel} from '../src/utils.js';

const BIDDER_CODE = 'allegro';
const BIDDER_URL = 'https://dsp.allegro.com/bid';
const GVLID = 1493;

function convertExtensionFields(request) {
  if (request.imp) {
    request.imp.forEach(imp => {
      if (imp.banner?.ext) {
        moveExt(imp.banner, '[com.google.doubleclick.banner_ext]')
      }
      if (imp.ext) {
        moveExt(imp, '[com.google.doubleclick.imp]')
      }
    });
  }

  if (request.app?.ext) {
    moveExt(request.app, '[com.google.doubleclick.app]')
  }

  if (request.site?.ext) {
    moveExt(request.site, '[com.google.doubleclick.site]')
  }

  if (request.site?.publisher?.ext) {
    moveExt(request.site.publisher, '[com.google.doubleclick.publisher]')
  }

  if (request.user?.ext) {
    moveExt(request.user, '[com.google.doubleclick.user]')
  }

  if (request.user?.data) {
    request.user.data.forEach(data => {
      if (data.ext) {
        moveExt(data, '[com.google.doubleclick.data]')
      }
    });
  }

  if (request.device?.ext) {
    moveExt(request.device, '[com.google.doubleclick.device]')
  }

  if (request.device?.geo?.ext) {
    moveExt(request.device.geo, '[com.google.doubleclick.geo]')
  }

  if (request.regs?.ext) {
    if (request.regs?.ext?.gdpr !== undefined) {
      request.regs.ext.gdpr = request.regs.ext.gdpr === 1;
    }

    moveExt(request.regs, '[com.google.doubleclick.regs]')
  }

  if (request.source?.ext) {
    moveExt(request.source, '[com.google.doubleclick.source]')
  }

  if (request.ext) {
    moveExt(request, '[com.google.doubleclick.bid_request]')
  }
}

function moveExt(obj, newKey) {
  if (!obj || !obj.ext) {
    return;
  }
  const extCopy = {...obj.ext};
  delete obj.ext;
  obj[newKey] = extCopy;
}

const converter = ortbConverter({
  context: {
    mediaType: BANNER,
    ttl: 360,
    netRevenue: true
  },
  imp(buildImp, bidRequest, context) {
    const imp = buildImp(bidRequest, context);
    if (imp?.banner?.topframe !== undefined) {
      imp.banner.topframe = imp.banner.topframe === 1;
    }
    if (imp?.secure !== undefined) {
      imp.secure = imp.secure === 1;
    }
    return imp;
  },
  request(buildRequest, imps, bidderRequest, context) {
    const request = buildRequest(imps, bidderRequest, context);

    if (request?.device?.dnt !== undefined) {
      request.device.dnt = request.device.dnt === 1;
    }

    if (request?.device?.sua?.mobile !== undefined) {
      request.device.sua.mobile = request.device.sua.mobile === 1;
    }

    if (request?.test !== undefined) {
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
  supportedMediaTypes: [BANNER, VIDEO, NATIVE],
  gvlid: GVLID,

  isBidRequestValid: function (bid) {
    return !!(bid);
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
    return converter.fromORTB({response: response.body, request: request.data}).bids;
  },

  onBidWon: function (bid) {
    const triggerImpressionPixel = config.getConfig('allegro.triggerImpressionPixel');

    if (triggerImpressionPixel && bid.burl) {
      triggerPixel(bid.burl);
    }
  }

}

registerBidder(spec);
