
async function generatenewfedextoken() {
  var urlencoded = new URLSearchParams();
  urlencoded.append("grant_type", "client_credentials");
  urlencoded.append("client_id", "l77256cb14334c4e8a8960a23e80778156");
  urlencoded.append("client_secret", "7fca7d7a-9025-4425-9473-cee7a88bc627");

  var requestOptions = {
    method: 'POST',
    body: urlencoded
  };

  let generatenewtoken = await fetch("https://apis.fedex.com/oauth/token", requestOptions);
  var data = await generatenewtoken.json();
  let fedextoken = await data['access_token'];

  return data['access_token'];
}

const fedextoken = await generatenewfedextoken();


async function fetchTracking(records) {
  let batch;
  //const fedextoken = await generatenewfedextoken();
  // GET FEDEX ORDER INFORMATION
  var myHeaders = new Headers();
  myHeaders.append("x-locale", "en_US");
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Bearer " + fedextoken);
  let dec = 0;

  let start = JSON.stringify({
    "trackingInfo": [

    ],
    "includeDetailedScans": 'True'


  });
  let count = 0;
  let obj = JSON.parse(start);
  for (let j = 0; j < records.length; j++) {
    var raw =
    {
      "trackingNumberInfo": {
        "trackingNumber": records[j]["tracking"]
      }
    }



    dec++;
    obj["trackingInfo"].push(raw);

  }
  obj = JSON.stringify(obj);
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: obj,
  };
  let cou4 = 0;

  let req = await fetch("https://apis.fedex.com/track/v1/trackingnumbers", requestOptions);
  var data = await req.json();
  console.log(data);
  let startcount = 0;
  let notfound = 0;
  let trackingInfo = [];
  cou4++;
  for (let i = 0; i < data['output']['completeTrackResults'].length; i++) {
    let trackinginformation = data['output']['completeTrackResults'][i]['trackResults'];
    // console.log(trackinginformation);
    // console.log(typeof(trackinginformation[0]['error']));
    if (typeof (trackinginformation[0]['error']) == 'undefined' && typeof ([trackinginformation][0][0]['shipmentDetails']['weight']) != 'undefined') {
      let rowID;
      let temparray = {};
      let temptrackingnumber = trackinginformation[0]['trackingNumberInfo']['trackingNumber'];
      //console.log(temptrackingnumber);
      //console.log(records[i]["tracking"]);
      if (temptrackingnumber == records[i]["tracking"]) {
        //console.log(temptrackingnumber);
        rowID = records[i]["recordId"];
        temparray["ID"] = rowID;
        temparray["senderzip"] = records[i]["senderzip"];
        temparray["receiverzip"] = records[i]["receiverzip"];
        temparray["Tracking Number"] = (temptrackingnumber);
        //console.log([trackinginformation][0][0]['packageDetails']['weightAndDimensions']['weight'][0]['value']);
        //if(Number([trackinginformation][0][0]['packageDetails']['packagingDescription']['count']) > 1){
        // console.log([trackinginformation][0][0]['packageDetails']['weightAndDimensions']['weight'][0]['value']);  
        //temparray["Weight"]  =[trackinginformation][0][0]['packageDetails']['weightAndDimensions']['weight'][0]['value'];
        if (typeof ([trackinginformation][0][0]['packageDetails']['weightAndDimensions']) != 'undefined' && typeof ([trackinginformation][0][0]['packageDetails']['weightAndDimensions']['dimensions']) != 'undefined') {
          temparray["Weight"] = [trackinginformation][0][0]['packageDetails']['weightAndDimensions']['weight'][0]['value'];
          temparray["length"] = [trackinginformation][0][0]['packageDetails']['weightAndDimensions']['dimensions'][0]['length'];
          temparray["width"] = [trackinginformation][0][0]['packageDetails']['weightAndDimensions']['dimensions'][0]['width'];
          temparray["height"] = [trackinginformation][0][0]['packageDetails']['weightAndDimensions']['dimensions'][0]['height'];
        }
        else if (typeof ([trackinginformation][0][0]['shipmentDetails']['weight'][0]) != 'undefined') {
          temparray["Weight"] = [trackinginformation][0][0]['shipmentDetails']['weight'][0]['value'];

        }

        //temparray["Weight"]  = [trackinginformation][0][0]['shipmentDetails']['weight'][0]['value'];
        temparray["Service"] = [trackinginformation][0][0]['serviceDetail']['type'];
        // console.log(temparray);
        trackingInfo.push(temparray);

      }
    }
    else {
      //console.log(trackinginformation);
      let temparray = {};
      temparray["recordId"] = records[i]["recordId"];
      FoundErrors(temparray);
    }
    startcount++;

  }


  //console.log(trackingInfo);
  //return await trackingInfo;
  await getRates(trackingInfo);
}
//END FEDEX TRACKING INFO FUNCTION

async function getRates(data) {
  let packages = [];
  let batch = [];
  var myHeaders = new Headers();
  myHeaders.append("x-locale", "en_US");
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Bearer " + fedextoken);
  for (let j = 0; j < data.length; j++) {
    let start;
    if (typeof (data[j]["length"]) != 'undefined') {
      start = JSON.stringify({
        "accountNumber": {
          "value": "631299458"
        },
        "requestedShipment": {
          "shipper": {
            "address": {
              "postalCode": data[j]["senderzip"],
              "countryCode": "US",
            }
          },
          "recipient": {
            "address": {
              "postalCode": data[j]["receiverzip"],
              "countryCode": "US",
            }
          },
          "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
          "rateRequestType": [
            "ACCOUNT",
            "LIST"
          ],
          "requestedPackageLineItems": [{

            "weight": {
              "units": "LB",
              "value": data[j]["Weight"],
            },
            "dimensions": {
              "length": data[j]["length"],
              "width": data[j]["width"],
              "height": data[j]["height"],
              "units": "IN"
            },
          }]
        },

      });
      console.log(data[j]['Tracking Number']);

    }
    else {
      console.log(data[j]['Tracking Number']);
      start = JSON.stringify({
        "accountNumber": {
          "value": "631299458"
        },
        "requestedShipment": {
          "shipper": {
            "address": {
              "postalCode": data[j]["senderzip"],
              "countryCode": "US",
            }
          },
          "recipient": {
            "address": {
              "postalCode": data[j]["receiverzip"],
              "countryCode": "US",
            }
          },
          "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
          "rateRequestType": [
            "ACCOUNT",
            "LIST"
          ],
          "requestedPackageLineItems": [{

            "weight": {
              "units": "LB",
              "value": data[j]["Weight"],
            },
          }]
        },

      });
    }
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: start,
    };
    //console.log(requestOptions);
    let req = await fetch("https://apis.fedex.com/rate/v1/rates/quotes", requestOptions)
    var rate = await req.json();
    console.log(rate);
    //console.log(data[j]);
    if (typeof (rate['output']) != 'undefined') {
      let temparray = data[j];
      for (let k = 0; k < rate['output']['rateReplyDetails'].length; k++) {
        //console.log(data[j]["Service"]);
        // console.log(rate['output']['rateReplyDetails']);
        if (rate['output']['rateReplyDetails'][k]['serviceType'] == data[j]["Service"]) {
          temparray["price"] = rate['output']['rateReplyDetails'][k]['ratedShipmentDetails'][0]['totalNetFedExCharge'];
          //console.log(temparray);
          batch.push(temparray);
        }
      }
      if (typeof (temparray["price"]) == 'undefined') {
        let thisOne = {};
        thisOne["recordId"] = data[j]["ID"];
        await FoundErrors(thisOne);
      }
    }
    else {
      let thisOne = {};
      thisOne["recordId"] = data[j]["ID"];
      await FoundErrors(thisOne);
    }
  }
  // console.log(batch);
  await insertTable(batch);
}
async function insertTable(data) {
  const format_time = new Date().toISOString();
  //console.log(data);
  for (let i = 0; i < data.length; i++) {
    await table.updateRecordAsync(data[i]["ID"], {
      "Shipping price": data[i]["price"],
      "Last Time Script Ran": format_time,

    });
  }


}
async function FoundErrors(record) {
  const format_time = new Date().toISOString();
  await table.updateRecordAsync(record["recordId"], {
    "Last Time Script Ran": format_time,
  });
}



// GET ALL DATA FROM THE VIEW NO TRACKING. NO TRACKING IS ONLY SHOWING ITEMS THAT HAVE A NULL VALUE FOR SHIPPING INFORMATION
let table = base.getTable("Orders");
let view = table.getView("HTKs Filtered for Price");
let queryresult = await view.selectRecordsAsync({ fields: ["Outbound Tracking Number", "Last Time Script Ran", "Shipping price", "Shipping Postal Code", "Temp Zip"] });
let part = queryresult.records.slice(0, 18);

let holdArray = [];
for (let record of part) {
  let TrackingArray = {};
  if (isNaN(Number(record.getCellValue("Outbound Tracking Number")))) {
    TrackingArray["recordId"] = record.id;
    TrackingArray["last script"] = record.getCellValue("Last Time Script Ran");
    await FoundErrors(TrackingArray);
  }
  else {
    TrackingArray["recordId"] = record.id;
    TrackingArray["last script"] = record.getCellValue("Last Time Script Ran");
    TrackingArray["senderzip"] = record.getCellValue("Temp Zip");
    TrackingArray["receiverzip"] = record.getCellValue("Shipping Postal Code");
    TrackingArray["tracking"] = record.getCellValue("Outbound Tracking Number");
    TrackingArray["price"] = record.getCellValue("Shipping price");
    holdArray.push(TrackingArray);
  }
}
//console.log(holdArray);
await fetchTracking(holdArray);
//console.log(holdArray);
//console.log(UpdatedTracking); 

