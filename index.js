(function() {
  var cheerio;
  if (typeof window === 'undefined') {
    // node
    module.exports = splitHtml;
    cheerio = require('cheerio');
  } else {
    window.splitHtml = splitHtml;
    // In the browser, use actual jQuery in place of Cheerio
    cheerio = {
      load: function(html) {
        return jQuery(html);
      }
    };
  }
  function splitHtml(html, splitOn, test) {
    if (!test) {
      test = function($el) {
        return true;
      };
    }
    var result = [];
    var splitAttr = 'data-' + token();
    var ignoreAttr = 'data-' + token();
    var $;
    var $matches;
    var i;
    var $match;
    var $wrapper;
    while (true) {
      $ = cheerio.load(html);
      $matches = $(splitOn);
      $match = null;
      for (i = 0; (i < $matches.length); i++) {
        $match = $matches.eq(i);
        if ((!$match.attr(ignoreAttr)) && test($match)) {
          break;
        } else {
          $match.attr(ignoreAttr, '1');
        }
        $match = null;
      }
      if (!$match) {
        result.push(html);
        break;
      }
      $match.attr(splitAttr, '1');
      var markup = $.html();
      var splitAt = markup.indexOf(splitAttr);
      var leftAt = markup.lastIndexOf('<', splitAt);
      if (leftAt === -1) {
        result.push(html);
        break;
      }
      var first = markup.substr(0, leftAt);

      // For the second segment we need to reopen the
      // open tags from the first segment. Reconstruct that.

      var reopen = '';
      $wrapper = cheerio.load('<div></div>')('div').eq(0);
      var $parents = $match.parents();
      for (i = $parents.length - 1; (i >= 0); i--) {
        var $parent = $parents.eq(i).clone();
        $parent.empty();
        $wrapper.empty();
        $wrapper.append($parent);
        var parentMarkup = $wrapper.html();
        var endTagAt = parentMarkup.indexOf('>');
        reopen = parentMarkup.substr(0, endTagAt + 1) + reopen;
      }

      // We can't just split off the next fragment at
      // > because the matching tag may be a container.
      // Move it to a wrapper to get its full markup,
      // then remove it from the original document. The
      // remainder of the original document now begins
      // where the matching tag used to

      markup = $.html();

      $wrapper = cheerio.load('<div></div>')('div').eq(0);
      $match.removeAttr(splitAttr);
      $wrapper.append($match);
      tag = $wrapper.html();
      $match.remove();
      markup = $.html();
      second = reopen + markup.substr(leftAt);

      // Let Cheerio close the open tags in the
      // first segment for us. Also mop up the attributes
      // we used to mark elements that matched the selector
      // but didn't match our test function
      first = cleanup(first);
      result.push(first);
      result.push(tag);
      html = cleanup(second);
    }
    return result;
    // Use Cheerio to strip out any attributes we used to keep
    // track of our work, then generate new HTML. This also
    // closes any tags we opened but did not close.
    function cleanup(html) {
      html = cheerio.load(html);
      html('[' + ignoreAttr + ']').removeAttr(ignoreAttr);
      html = html.html();
      return html;
    }

    function token() {
      return Math.floor(Math.random() * 1000000000).toString();
    }
  }
})();

