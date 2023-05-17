
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
  let batch = [];

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
    "includeDetailedScans": true


  });
  let count = 0;
  let obj = JSON.parse(start);
  for (let j = 0; j < records.length; j++) {
    var raw =
    {
      "trackingNumberInfo": {
        "trackingNumber": records[j]["returnTrackingNumber"]
      }
    }



    dec++;
    obj["trackingInfo"].push(raw);
    if (dec >= 30) {
      count++;
      obj = JSON.stringify(obj);

      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: obj,
      };
      batch.push(requestOptions);

      start = JSON.stringify({
        "trackingInfo": [

        ],
        "includeDetailedScans": true


      });
      obj = JSON.parse(start);
      dec = 0;
    }
  }
  let results = [];
  let cou4 = 0;
  //for(let i=0;i < 6;i+=4){
  // const fetchReq1 = fetch("https://apis.fedex.com/track/v1/trackingnumbers", batch[i]).then((res) => res.json());

  //const fetchReq2 = fetch("https://apis.fedex.com/track/v1/trackingnumbers", batch[i+1]).then((res) => res.json());

  //const fetchReq3 = fetch("https://apis.fedex.com/track/v1/trackingnumbers", batch[i+2]).then((res) => res.json());
  // do fetch requests in parallel
  // using the Promise.all() method
  // const allData = Promise.all([fetchReq1, fetchReq2, fetchReq3]);
  // attach then() handler to the allData Promise
  //allData.then((res) => console.log(res));

  //}
  for (let i = 0; i < batch.length; i++) {
    let req = await fetch("https://apis.fedex.com/track/v1/trackingnumbers", batch[i])
    var data = await req.json();
    results.push(data);
  }
  //console.log(results);
  let startcount = 0;
  let notfound = 0;
  let trackingInfo = [];
  for (let record of results) {
    cou4++;
    for (let i = 0; i < 30; i++) {


      let trackinginformation = record['output']['completeTrackResults'][i]['trackResults'];


      //for (let index = 0; index < trackinginformation.length; index++) {
      if (!("error" in trackinginformation)) {
        let rowID;
        let temparray = {};
        let temptrackingnumber = trackinginformation[0]['trackingNumberInfo']['trackingNumber'];
        if (temptrackingnumber == records[startcount]["returnTrackingNumber"]) {
          rowID = records[startcount]["recordId"];
          temparray["ID"] = rowID;
        }
        else {
          notfound++;
        }
        if (trackinginformation[0]['error']) {
          temparray["Tracking Number"] = (temptrackingnumber);
          temparray["Status"] = ("Error Not Found");
          trackingInfo.push(temparray);
        }
        else {
          let tempDeliveryStatus = trackinginformation[0]['latestStatusDetail']['statusByLocale'];

          if (tempDeliveryStatus == "Delivered") {
            //temptrackingnumber = trackinginformation[0]['trackingNumberInfo']['trackingNumber'];
            let tempDeliveryCity = trackinginformation[0]['latestStatusDetail']['scanLocation']['city'];
            let tempDeliveryTime = trackinginformation[0]['dateAndTimes']['0']['dateTime'];
            temparray["Tracking Number"] = (temptrackingnumber);
            temparray["Status"] = ("Delivered");
            temparray["City"] = (tempDeliveryCity);
            temparray["Time"] = (tempDeliveryTime);
          }
          else {
            //temptrackingnumber = trackinginformation[0]['trackingNumberInfo']['trackingNumber'];
            //  console.log("Batch: " + cou4 + "Tracking Number: " + temptrackingnumber);
            // let temporgincity = trackinginformation[0]['originLocation']['locationContactAndAddress']['address']['city'];
            temparray["Tracking Number"] = (temptrackingnumber);
            temparray["Status"] = (tempDeliveryStatus);
            //temparray["City"]=(temporgincity);
          }
          trackingInfo.push(temparray);
        }
      }
      else {
        // cou4++;
      }
      startcount++;
    }
  }
  return await trackingInfo;

}
//END FEDEX TRACKING INFO FUNCTION


// GET ALL DATA FROM THE VIEW NO TRACKING. NO TRACKING IS ONLY SHOWING ITEMS THAT HAVE A NULL VALUE FOR SHIPPING INFORMATION
let table = base.getTable("PCR HTK Tracking");
let view = table.getView("No Return Shipping Status");
let queryresult = await view.selectRecordsAsync({ fields: ["Last Time Script Ran", "Timestamp", "Return Shipping Status", "Return Tracking #"] });
//console.log("query results:"+queryresult.records.length);

//Depends on batches currently 16 batches * 30 per = 
let part = queryresult.records.slice(0, 60);
//console.log(part);

let holdArray = [];
for (let record of part) {
  let TrackingArray = {};
  TrackingArray["recordId"] = record.id;
  TrackingArray["last script"] = record.getCellValue("Last Time Script Ran");
  TrackingArray["timestamp"] = record.getCellValue("Timestamp");
  TrackingArray["returnTrackingNumber"] = record.getCellValue("Return Tracking #").trim();

  if (record.getCellValue("Return Shipping Status") != null) {
    let t = record.getCellValue("Return Shipping Status")
    TrackingArray["status"] = t["name"];
  }
  else {
    TrackingArray["status"] = null;

  }
  holdArray.push(TrackingArray);
}
let er = 0;
let UpdatedTracking = await fetchTracking(holdArray);
//console.log(holdArray); 
console.log(UpdatedTracking);

const format_time = new Date().toISOString();

for (let i = 0; i < UpdatedTracking.length; i++) {
  //console.log(i);
  console.log(UpdatedTracking[i]["Status"]);
  if (UpdatedTracking[i]["ID"] == holdArray[i]["recordId"]) {
    if (UpdatedTracking[i]["Status"] == holdArray[i]["status"]) {
      await table.updateRecordAsync(holdArray[i]["recordId"], {
        "Last Time Script Ran": format_time
      });

      //console.log("SUCCESS STATUS SAME  " + UpdatedTracking[i]["Tracking Number"]);
    }
    else {
      if (UpdatedTracking[i]["Status"] == "Delivered") {
        await table.updateRecordAsync(UpdatedTracking[i]["ID"], {
          "Delivery City": UpdatedTracking[i]["City"],
          "Delivery Time": UpdatedTracking[i]["Time"],
          "Return Shipping Status": { name: UpdatedTracking[i]["Status"] },
          "Last Time Script Ran": format_time,
        });
        // console.log("SUCCESS STATUS DELIVERED  "+ UpdatedTracking[i]["Tracking Number"])

      }
      else if (UpdatedTracking[i]["Status"] == "Error Not Found" || UpdatedTracking[i]["Status"] == "Shipment exception") {
        await table.updateRecordAsync(holdArray[i]["recordId"], {
          "Last Time Script Ran": format_time
        });
      }
      else {
        await table.updateRecordAsync(holdArray[i]["recordId"], {
          "Last Time Script Ran": format_time,
          "Return Shipping Status": { name: UpdatedTracking[i]["Status"] },
          "Delivery City": UpdatedTracking[i]["City"],
        });
        // console.log("SUCCESS STATUS OTHER  "+ UpdatedTracking[i]["Tracking Number"])

      }

    }
  } else {
    er++;
  }

}
