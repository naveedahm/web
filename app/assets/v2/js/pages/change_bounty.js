
// Overwrite from shared.js
// eslint-disable-next-line no-empty-function
function trigger_form_hooks() {
}

$(document).ready(function() {
  const oldBounty = document.result;
  const keys = Object.keys(oldBounty);
  const form = $('#submitBounty');

  // do some form pre-checks
  if (String(oldBounty.project_type).toLowerCase() !== 'traditional') {
    $('#reservedForDiv').hide();
  }

  if (oldBounty.is_featured === true) {
    $('#featuredBounty').prop("checked", true);
    $('#featuredBounty').prop("disabled", true);
  }

  while (keys.length) {
    const key = keys.pop();
    const val = oldBounty[key];
    const ele = form.find('[name=' + key + ']');

    ele.val(val);
    ele.find(
      'option:contains(' + val + ')'
    ).prop('selected', true);
  }

  $('.js-select2').each(function() {
    $(this).select2();
  });

  // show/hide the reserved for selector based on the project type
  $('.js-select2[name=project_type]').change(function(e) {
    if (String(e.target.value).toLowerCase() === 'traditional') {
      $('#reservedForDiv').show();
    } else {
      $('#reservedForDiv').hide();
    }
  });

  const reservedForHandle = oldBounty['reserved_for_user_handle'];

  userSearch(
    '#reservedFor',
    // show address
    false,
    // theme
    '',
    // initial data
    reservedForHandle ? [reservedForHandle] : [],
    // allowClear
    true
  );

  form.validate({
    submitHandler: function(form) {
      const inputElements = $(form).find(':input');
      const formData = {};

      inputElements.removeAttr('disabled');
      $.each($(form).serializeArray(), function() {
        formData[this.name] = this.value;
      });
      inputElements.attr('disabled', 'disabled');

      loading_button($('.js-submit'));

      // update bounty reserved for
      const reservedFor = $('.username-search').select2('data')[0];

      if (reservedFor) {
        formData['reserved_for_user_handle'] = reservedFor.text;
      }

      if (formData['featuredBounty'] === '1') {
        formData['featuredBounty'] = 'True';
      }

      const bountyId = document.pk;
      const payload = JSON.stringify(formData);

      $.post('/bounty/change/' + bountyId, payload).then(
        function(result) {
          inputElements.removeAttr('disabled');
          unloading_button($('.js-submit'));

          result = sanitizeAPIResults(result);
          _alert({ message: result.msg }, 'success');

          if (result.url) {
            setTimeout(function() {
              document.location.href = result.url;
            }, 1000);
          }
        }
      ).fail(
        function(result) {
          inputElements.removeAttr('disabled');
          unloading_button($('.js-submit'));

          var alertMsg = result && result.responseJSON ? result.responseJSON.error : null;

          if (alertMsg === null) {
            alertMsg = gettext('Network error. Please reload the page and try again.');
          }
          _alert({ message: alertMsg }, 'error');
        }
      );
    }
  });

  let usdFeaturedPrice = $('.featured-price-usd').text();
  let ethFeaturedPrice;

  getAmountEstimate(usdFeaturedPrice, 'ETH', function(amountEstimate) {
    ethFeaturedPrice = amountEstimate['value'];
    $('.featured-price-eth').text(`+${amountEstimate['value']} ETH`)
  });

  var payFeaturedBounty = function() {
    web3.eth.sendTransaction({
      to:'0xeDa95eD3e3436C689376889F9eD0a8f4bA23E866',
      from: web3.eth.coinbase,
      value:web3.toWei(ethFeaturedPrice, "ether")
    }, console.log)

    return callback();
  }
});
