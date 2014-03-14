var storage = chrome.storage.local;


/* DATA FORMAT
* {<user>: { <link>: {<bucket>: <value>}, <link>: {<bucket>: <value>}, <link>: {<bucket>: <value>}, <link>: {<bucket>: <value>} ..... }} 
*
*
*/

// migrates archive data from csv format to a dictionary
//@param: user - Migrates archive data from csv to dictionary format for the specified user.

function migrateArchiveData (user) {
	
	storage.get(user, function(items) {
		var data = items[user];

		// if archive is empty
		if (typeof data == 'undefined') {
			console.log('No data to migrate.');
			return -1;
		}

		console.log("MIGRATING DATA");

        if(typeof(data) == 'string') {
            convertDataToDict(data);
        }
        else {
            convertDataToV2_2(data);
        }
	})

}

// converts csv data to dictionary
function convertDataToDict(data) {

	var data_dict = {};
	var temp, i;

	try {

		// split csv format data by ;
		data = data.split(';');

		for (i=0; i<data.length; i++) {
			temp = data[i].trim();

			// if empty link encountered i.e. simultaneous ; as a result of removing link from archive then continue;
			if (temp.length === 0)
				continue;

			// key: link - value: {bucket = ""} 
			data_dict[data[i]] = {"bucket":""};

		}

		// temperory object to be able to store content in chrome storage
		var toStore_data = {};
		toStore_data[user] = data_dict;

		// check is all links from csv data are present in dictionary. If not raise Data leakage alert and exit.
		for(i=0; i<data.length; i++) {

			if (data[i] in data_dict == false && data[i] != '') {
				alert('Data leakage while converting existing data to new format. Exiting the routine.');
				return -1;
			}

		}

		// set the userSetting field to data_version: v2. This indicates that the data has already been migrated and no need to call the migrateData routine.
		var userSetting_label = user + ":Setting";
		var system_setting = {};
		system_setting[userSetting_label] = {"data_version": "v2"};

		// clear the existing csv data
		storage.remove(user, function() {

			// set the new dictionary data
			storage.set(toStore_data, function() {

				// set the system setting parameter to 				
				storage.set(system_setting, function() {
					//alert('Data migration successful');
					//location.reload();
                    convertBucketToDict(data);
				})

			})

		})

	}
	catch (Error) {
		console.log('Error while converting data to new format.');
		console.log("Error message: "+err.message)
	}
}

// Converts data to v2.2
function convertDataToV2_2(data) {
    var userSetting_label = user + ":Setting";
            
    storage.get(userSetting_label, function(items) {
        if (items[userSetting_label]['data_version'] == 'v2') {
            convertBucketsToV2_2(function() {
                convertLinksToV2_2(data);
            });
        }
    });
}

function convertBucketsToV2_2(callback) {
    var bucketContainer =  user + ':Buckets';
    
    storage.get(bucketContainer, function(items) {
        var buckets = items[bucketContainer].split(';');
                
        for (var b in buckets) {
            if(buckets[b] == '') {
                buckets.splice(b, 1);
            }
        }
        
        var bucketDict = {};
        bucketDict[bucketContainer] = buckets;
        
        storage.set(bucketDict, callback);
    });
}

// Converts Bucket (which was stored previously as csv) to array of strings.
function convertLinksToV2_2(data) {
    for (var link in data) {
        var buckets = data[link]["bucket"];
        buckets = buckets.split(';');
        
        data[link]['bucket'] = [];
        
        for (var b in buckets) {
            if(buckets[b] != '') {
                data[link]['bucket'].push(buckets[b]);
            }
        }
    }
    
    // set the userSetting field to data_version: v2.2 This indicates that the data has already been migrated and no need to call the migrateData routine.
    var userSetting_label = user + ":Setting";
        
    storage.get(userSetting_label, function(system_settings) {
        system_settings[userSetting_label]['data_version'] = 'v2.2';
        
        // temperory object to be able to store content in chrome storage
        var toStore_data = {};
        toStore_data[user] = data;
            
        // set the new dictionary data
        storage.set(toStore_data, function() {
            // set the system setting parameter to 				
            storage.set(system_settings, function() {
                alert('Data migration successful');
                location.reload();
            })

        })
    });
}