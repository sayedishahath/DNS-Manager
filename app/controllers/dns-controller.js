const AWS = require('aws-sdk');
const fs = require('fs'); // Import the fs module
const csvParser = require('csv-parser')
const DNSRecord = require('../models/dns-model')
const Domain = require('../models/domain-model')
const dnsCtrl = {}
const {validationResult} = require('express-validator')
const route53 = new AWS.Route53();

dnsCtrl.getAllDNSRecords = async (req, res) => {
    try {
      const dnsRecords = await DNSRecord.find({zoneId:req.params.hostedZoneId});
      res.json(dnsRecords);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};
dnsCtrl.getDNSRecordById = async (req, res) => {
    try {
        const dnsRecord = await DNSRecord.findById(req.params.id);
        if (!dnsRecord) {
        return res.status(404).json({ message: 'DNS record not found' });
        }
        res.json(dnsRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


dnsCtrl.createBulkDNSRecord = async(req, res) => {
  const hostedZoneId = req.params.hostedZoneId;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse CSV file
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const records = [];

    if (fileExtension === 'csv') {
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (data) => {
          records.push(data);
        })
        .on('end', async () => {
          try {
            // Create hosted zone with array of domains
            const recordDatas = records.map(record => record);
            console.log(recordDatas);
            await addRecords(recordDatas, hostedZoneId);

            // Delete CSV file after processing
            fs.unlinkSync(req.file.path);

            res.status(200).json({ fileMessage: 'File uploaded successfully', dnsMessage: 'records created successfully' });
          } catch (error) {
            console.error('Error adding records:', error);
            res.status(500).json({ message: 'Failed to add records' });
          }
        })
        .on('error', (error) => {
          console.error('Error parsing CSV file:', error);
          res.status(500).json({ message: 'Failed to parse CSV file' });
        });
    }else if(fileExtension ==='json'){ 
    
      try {
        const jsonData = JSON.parse(fs.readFileSync(req.file.path, 'utf8'));
        const recordDatas = jsonData.map(record => record);
        console.log('JSON Records:', recordDatas);
        await addRecords(recordDatas, hostedZoneId);
        fs.unlinkSync(req.file.path);
        return res.status(200).json({ fileMessage: 'File uploaded successfully', dnsMessage: 'Records created successfully' });
      } catch (error) {
        console.error('Error processing JSON file:', error);
        return res.status(500).json({error, message: 'Failed to process JSON file' });
      }
    } else {
      return res.status(400).json({ message: 'Unsupported file type' });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

async function addRecords(recordDatas, hostedZoneId) {
  for (const recordData of recordDatas) {
    const params = {
      ChangeBatch: {
        Changes: [
          {
            Action: 'CREATE',
            ResourceRecordSet: {
              Name: recordData.name,
              Type: recordData.recordType,
              TTL: parseInt(recordData.ttl),
              ResourceRecords: [{ Value: recordData.recordValue }]
            }
          }
        ]
      },
      HostedZoneId: hostedZoneId
    };

    await route53.changeResourceRecordSets(params).promise();

    const recordsToInsert = {
      domain: recordData.name,
      recordType: recordData.recordType,
      recordValue: recordData.recordValue,
      ttl: recordData.ttl,
      zoneId: hostedZoneId
    };

    // Assuming DNSRecord model has been defined
    await DNSRecord.insertMany(recordsToInsert);
  }

  // Send response outside the loop
  // res.status(201).json({ message: 'DNS records created successfully' });
}

dnsCtrl.createDNSRecord = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    try {
    const dnsRecord = new DNSRecord(req.body);
    const  domain = await Domain.findOne({zoneId: req.params.hostedZoneId});
    console.log(domain)
    const params = {
        ChangeBatch: {
          Changes: [
            {
              Action: 'CREATE',
              ResourceRecordSet: {
                Name: dnsRecord.domain,
                Type: dnsRecord.recordType,
                TTL: dnsRecord.ttl, 
                ResourceRecords: [{ Value: dnsRecord.recordValue }]
              }
            }
          ]
        },
        HostedZoneId: domain.zoneId
      };
      await route53.changeResourceRecordSets(params).promise();
      dnsRecord.zoneId=domain.zoneId;
      const newDNSRecord = await dnsRecord.save();
      res.status(201).json({newDNSRecord, message: 'DNS record created successfully' });
    } catch (error) {
        console.error('Error creating DNS record:', error);
        res.status(500).json({error, message: 'Failed to create DNS record' });
    }
};

dnsCtrl.updateDNSRecord = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    try {
        const id = req.params.id;
        const body = req.body;
        const  domain = await Domain.findOne({name: body.domain});
        console.log(domain)
       
        const params = {
          ChangeBatch: {
            Changes: [
              {
                Action: 'UPSERT', // Update or insert
                ResourceRecordSet: {
                  Name: body.domain,
                  Type: body.recordType,
                  TTL: body.ttl,
                  ResourceRecords: [{ Value: body.recordValue }]
                }
              }
            ]
          },
          HostedZoneId: domain.zoneId // Replace with your hosted zone ID
        };
        await route53.changeResourceRecordSets(params).promise();
        const updateDNSRecord = await DNSRecord.findByIdAndUpdate(id, body ,{new: true})
        res.status(200).json({ updateDNSRecord,message: 'DNS record updated successfully' });
      } catch (error) {
        console.error('Error updating DNS record:', error);
        res.status(500).json({ message: 'Failed to update DNS record' });
      }
};

dnsCtrl.deleteDNSRecord = async (req, res) => {
    try {
        const id = req.params.id;
        const dnsRecord = await DNSRecord.findById(id)
        console.log(dnsRecord)
        const params = {
          ChangeBatch: {
            Changes: [
              {
                Action: 'DELETE',
                ResourceRecordSet: {
                  Name: dnsRecord.domain, // Replace with the DNS record name
                  Type: dnsRecord.recordType,// Replace with the DNS record type
                  TTL:dnsRecord.ttl,
                  ResourceRecords: [{ Value: dnsRecord.recordValue }]
                }
              }
            ]
          },
          HostedZoneId: dnsRecord.zoneId // Replace with your hosted zone ID
        };
        await route53.changeResourceRecordSets(params).promise();
        const deleteDNSRecord = await DNSRecord.findByIdAndDelete(id)
        res.status(200).json({deleteDNSRecord, message: 'DNS record deleted successfully' });
      } catch (error) {
        console.error('Error deleting DNS record:', error);
        res.status(500).json({ message: 'Failed to delete DNS record' });
      }
};

module.exports = dnsCtrl
