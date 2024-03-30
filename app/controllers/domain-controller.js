const Domain = require('../models/domain-model')
const AWS = require( 'aws-sdk' );
const DNSRecord = require('../models/dns-model');
const fs = require('fs'); // Import the fs module
const csvParser = require('csv-parser')
const route53 = new AWS.Route53();

const domainCtrl={}
domainCtrl.uploadBukDomain = async(req,res)=>{
  try{
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Parse CSV file
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const records = [];
    if (fileExtension === 'csv'){
    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => {
        
        records.push(data);
        console.log(records)
      })
      .on('end', async () => {
       // Create hosted zone with array of domains
       const domainNames = records.map(record => record.domain);
       console.log(domainNames);
       await createHostedZone(domainNames);

       // Delete CSV file after processing
       fs.unlinkSync(req.file.path);
       res.status(200).json({fileMessage:'file uploaded successfully', dnsMessage: 'HostedZone created successfully' });
       
     })
     .on('error', (error) => {
       console.error('Error parsing CSV file:', error);
       res.status(500).json({ message: 'Failed to parse CSV file' });
     });
    }else if(fileExtension ==='json'){
      
      // Read JSON file
      fs.readFile(req.file.path, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return;
        }
        const jsonData = JSON.parse(data);
        console.log(jsonData);

        const domainNames = jsonData.map(record => record.domain);
        console.log(domainNames)
        createHostedZone(domainNames);
      })
     
    fs.unlinkSync(req.file.path);

    res.status(200).json({fileMessage:'file uploaded successfully', dnsMessage: 'Domains added successfully' });
  }
  }catch(error){
    console.error('Error uploading  file:', error);
    res.status(500).json({error, msg: 'Failed to upload file' });
  }
  async function createHostedZone(domainNames) {
    for (const domainName of domainNames) {
      const params = {
        Name: domainName,
        CallerReference: Date.now().toString(),
        HostedZoneConfig: {
          Comment: 'bulk added hosted zone',
          PrivateZone: false
        }
      };
      const response = await route53.createHostedZone(params).promise();
      const domainsToInsert =  ({ 
        name: domainName,
        zoneId:response.HostedZone.Id.replace('/hostedzone/',''),
        userId:req.user.id});
      await Domain.insertMany(domainsToInsert);
      recordsToInsert = ({
        domain:domainName,
        recordType:"NS",
        recordValue:response.DelegationSet.NameServers.join('\n'),
        ttl:"88640",
        zoneId:response.HostedZone.Id.replace('/hostedzone/','')})
        await DNSRecord.insertMany(recordsToInsert);
    }
  } 
}
 
domainCtrl.createDomain = async(req,res)=>{
    const body = req.body
    try{
       const domain = new Domain(body)
       const dnsRecord = new DNSRecord()
        const params = {
            CallerReference: `create-hosted-zone-${Date.now()}`, // Unique identifier for the request
            Name: domain.name, // The domain name for the hosted zone
            HostedZoneConfig: {
              Comment: 'single HostedZone' // Optional comment
            }
          }
        
        const response = await route53.createHostedZone(params).promise();
        console.log(response.NameServers)
        domain.zoneId=response.HostedZone.Id.replace('/hostedzone/','');
        domain.userId=req.user.id
        const hostedZone= await domain.save()
        dnsRecord.domain = domain.name
        dnsRecord.recordType='NS'
        dnsRecord.recordValue=response.DelegationSet.NameServers.join('\n')
        dnsRecord.ttl='86400'
        dnsRecord.zoneId=domain.zoneId
        await dnsRecord.save()
        res.status(201).json(hostedZone)
        console.log('Hosted zone created:', response.HostedZone.Id);
        console.log('Nameservers:', response.DelegationSet.NameServers);

    }catch(error){
        console.error('Error creating hosted zone:', error);
        res.status(500).json(error)
    }
}
domainCtrl.getDomain = async(req,res)=>{
  try{
    const userDomains=await Domain.find({userId:req.user.id})
    res.status(200).json(userDomains)
  }catch(err){
    res.status(500).json(err)
  }
}
domainCtrl.deleteDomain = async(req,res)=>{
  try {
    const hostedZoneId  = req.params.hostedZoneId;

    const params = {
      Id: hostedZoneId // The ID of the hosted zone to delete
    };
    await route53.deleteHostedZone(params).promise();
    const deletedDomain = await Domain.findOneAndDelete({zoneId:hostedZoneId});
    await DNSRecord.deleteMany({zoneId:deletedDomain.zoneId})
    res.status(200).json({deletedDomain, message: 'Hosted zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting hosted zone:', error);
    res.status(500).json({errors:error, message: 'Failed to delete hosted zone' });
  }
}
module.exports = domainCtrl