import { NativeEventEmitter, NativeModules } from 'react-native';
//https://github.com/innoveit/react-native-ble-manager
import BleManager, {Peripheral} from 'react-native-ble-manager';

//////

BleManager.start();
const service = "";
const characteristic = "";
const data = [0,0];

enum SensorStatus {
  //未知 Unknown
  Unknown,
  //监测结束 End of monitoring
  Monitored,
  //监测中 Monitoring
  Monitoring,
  //数据初始化中 Data initialization
  DataInitialization,
  //传感器初始化中 Sensor initialization
  SensorInitialization,
}





class SGV
{
  value:number;
  time:number;

  constructor(value:number,time:number)
  {
    this.value = value;
    this.time = time;
  }

  
}


class SGVs
{
  sgvMap: Map<number,SGV> = new Map<number,SGV>();
  total:number = 0;

 
}

enum messages
  {
    TAG_TIME_SYNCHRONIZATION="Time Synchronization",
    TAG_BIND_DEVICE = "Bind the device",
    TAG_REQUEST_WORK_LOG = "Request a site diary",
    TAG_REQUEST_WORK_STATUS_AND_ALARM = "Request working status and alarms",
    TAG_GET_FIRMWARE_VERSION = "Obtain the firmware version",
    TAG_REQUEST_BLOOD_SUGAR_CURRENT_DATA = "Request blood glucose current data",
    TAG_REQUEST_DEVICE_RUNNING_TIME = "Request device uptime",
    TAG_REQUEST_BATTERY_RUNNING_TIME = "Request battery runtime",
    TAG_REQUEST_DEVICE_BATTERY_VOLTAGE = "Request a device battery voltage",
    TAG_REQUEST_REFERENCE = "Request a reference",
    TAG_REQUEST_DISCONNECT = "Request to end connection"
  }
//lib/screens/mainLogin/devices.dart - FFB2
class CGMUtil
{
  static _instance: CGMUtil;
  //CGMUtil._internal();
  static bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
  static sgvs: Map<string,SGVs> = new Map<string,SGVs>();
  static currentSensorID: any = "";
  static mlStartTime: number = 0;
  static getInstance():CGMUtil
  {
    this._instance ??= CGMUtil._internal();
    return this._instance;
  }

  static currentStatus: SensorStatus = SensorStatus.Unknown;

  static analyzingWorkStatus(value:number[])
  {
    if ((value[2] & (0x01 << 4)) == 0x10)
    {
      console.log("End of monitoring");
      this.currentStatus = SensorStatus.Monitored;
    }
    else if ((value[2] & (0x01 << 3)) == 0x08)
    {
      console.log("Monitoring");
      this.currentStatus = SensorStatus.Monitoring;
    }
    else if ((value[2] & (0x01 << 2)) == 0x04)
    {
      console.log("Data initialization");
      this.currentStatus = SensorStatus.DataInitialization;
    }
    else if ((value[2] & (0x01 << 1)) == 0x02)
    {
      console.log("Sensor initialization");
      this.currentStatus = SensorStatus.SensorInitialization;
    }

    if ((value[3] & (0x01 << 1)) == 0x02)
    {
      console.log("Blood glucose current too low alarm");
    }
    else if ((value[3] & (0x01 << 2)) == 0x04)
    {
      console.log("Excessive blood glucose current alarm");
    }
    else if ((value[3] & (0x01 << 3)) == 0x08)
    {
      console.log("Low battery alarm");
    }
    else if ((value[3] & (0x01 << 4)) == 0x10)
    {
      console.log("Sensor has reached maturity alert");
    }
    else if ((value[3] & (0x01 << 5)) == 0x20)
    {
      console.log("Log store full alarm");
    }
  }

  static bleResponse(peripheral: Peripheral,service: string,characteristic: string) {
    var bytes = [0x0f, 0xae, 0x00, 0x00, 0x00, 0x00, 0xa1];
    BleManager.connect(peripheral.id).then(()=>{
      BleManager.retrieveServices(peripheral.id,[service]).then(()=>{
        BleManager.write(peripheral.id,service,characteristic,bytes).then(()=>{
          console.log("Bytes Written")
        });
      });
    });
    //characteristicRead.write(bytes, withoutResponse: true);
  }

  public static handleDiscoverDevice(peripheral:Peripheral,service:string,characteristic:string,data:number[])
  {
    return new Promise((resolve,reject)=>{
      BleManager.stopScan().then(()=>{
        BleManager.connect(peripheral.id).then(()=>{
          BleManager.retrieveServices(peripheral.id,[service]).then(()=>{
            BleManager.write(peripheral.id,service,characteristic,data).then(()=>{
              BleManager.read(peripheral.id,service,characteristic).then((data)=>{
    
                
                //"StreamAnalyze Look for Baotou $index");
                if(data.indexOf(0x1f) == -1)
                  {
                    reject("Element Not Found");
                  }
                else
                {
                  var newData = data.slice(data.indexOf(0x1f));
                  if(newData.length < 5)
                  {
                    reject("Length Is Incorrect");
                  }
                  if(newData[1] == 0xa6 || newData[1] == 0xc1)
                  {
                    //var nPackLen: number = (data[2] & 0xff) + 4;
                    if(newData.length < (newData[2] & 0xff) + 4)
                    {
                      reject("Length Is Incorrect");
                    }
                  }
                  switch(newData[1])
                  {
                    case 0xa0:
                      this.bleResponse(peripheral,service,characteristic);
                        //Task.sendByName(messages.TAG_TIME_SYNCHRONIZATION,)
                        break;
                    case 0xa1:
                      this.bleResponse(peripheral,service,characteristic);
                      if (newData[2] == 0xaa)
                      {
                        var sensorID:number = ((newData[5] & 0xff) << 16) + ((newData[4] & 0xff) << 8) + (newData[3] & 0xff);
                        GlobalData.sensorId = sensorID.toString();
                        GlobalData.sensorStartDate = new Date().toLocaleDateString();
                        Task.sendByName(messages.TAG_BIND_DEVICE, Result(sensorID.toString(), ResultCode.SUCCESS));
                      }
                      else if (newData[2] == 0x55)
                      {
                        Task.sendByName(messages.TAG_BIND_DEVICE, Result(0, ResultCode.SUCCESS));
                      }
                      break;
                    case 0xa2:
                      console.log("StreamAnalyze Change the password");
                      break;
                    case 0xa4:
                      console.log("StreamAnalyze End of monitoring instructions");
                      break;
                    case 0xa7:
                      console.log("StreamAnalyze Request a blood glucose current data command");
                      break;
                    case 0xa8:
                      console.log("StreamAnalyze Request working status and alarm instructions");
                      break;
                    case 0xa9:
                      console.log("StreamAnalyze Request working status and alarm instructions (response)");
                      this.bleResponse(peripheral,service,characteristic);
                      this.analyzingWorkStatus(newData);
                
                      break;
                    case 0xaa:
                      console.log("StreamAnalyze Transfer log instructions");
                      break;
                    case 0xad:
                      console.log("StreamAnalyze Request the transmitter ID directive");
                      break;
                    case 0xae:
                      console.log("StreamAnalyze Confirm the instruction");
                      break;
                      case 0xab:
                        console.log("StreamAnalyze Firmware version");
                        this.bleResponse(peripheral,service,characteristic);
                        var firmwareNumber =
                            "${newData[4] & 0xff}.${newData[3] & 0xff}.${newData[2] & 0xff}";
                        var firmwareVersionCode = ((newData[4] & 0xff) << 16) + ((newData[3] & 0xff) << 8) + (newData[2] & 0xff);
                        GlobalData.firmware = firmwareNumber;
                        console.log("Global Firmware value is set to: ${GlobalData.firmware}");
                        console.log("StreamAnalyze Firmware version $firmwareNumber $firmwareVersionCode");
                        Task.sendByName(TAG_GET_FIRMWARE_VERSION,
                            Result(firmwareNumber, ResultCode.SUCCESS));
                        break;
                      case 0xa5:
                        console.log("StreamAnalyze Device battery voltage");
                        break;
                      case 0xb1:
                        console.log("StreamAnalyze Device uptime");
                        break;
                      case 0xb2:
                        console.log("StreamAnalyze Device uptime");
                        break;
                      case 0xa6:
                        this.bleResponse(peripheral,service,characteristic);
                        var x:number = 2;
                        var start:number = ((newData[4 + x] & 0xff) << 8) + (newData[3 + x] & 0xff);
                        var end:number = ((newData[6 + x] & 0xff) << 8) + (newData[5 + x] & 0xff);
                        var count:number = ((newData[4] & 0xff) << 8) + (newData[3] & 0xff);
                        console.log("StreamAnalyze Blood glucose current data - total: $count originate: $start Come to an end: $end");
                        
                        this.sgvs.set(this.currentSensorID,new SGVs());
                        this.sgvs.get(this.currentSensorID)!.total = count;
                        for(var i = start; i <= end; i++)
                        {
                          console.log("Timestamp Start: $mlStartTime");
                          var time = (this.mlStartTime + i * (3 * 60 * 1000)) - 35000;
                          var evalue = ((newData[8 + x + (i - start) * 2] & 0xff) << 8) + (newData[7 + x + (i - start) * 2] & 0xff);
                          if (time > 347205930)
                          {
                            console.log("StreamAnalyze Blood glucose current data - time: $time Blood glucose value: $evalue");
                            var addHistory:(number|number) = {time: evalue};
                            GlobalData.historyMap.addEntries(addHistory.entries);
                            dashboardValueNotifier.updateScreenTime(GlobalData.historyMap.keys.last);
                            console.log("${GlobalData.historyMap}, Total Map Count: ${GlobalData.historyMap.length}");
                            // int evalue = ((value[10] & 0xff) << 8) + (value[9] & 0xff);
                            // log("StreamAnalyze Blood glucose raw data - time: $time Glucose raw value: $evalue");
                            //rawValue.newCurrent.value = evalue;
                            // timeValue.newTime.value = time;
                            // print("TIME VALUE IS: ${timeValue.newTime.value}");
                            GlobalData.historyArray.add(evalue);
                            GlobalData.timeHistoryArray.add(time);
                            console.log("History Array Total Count: ${GlobalData.historyArray.length}");
                            //int key = time;
                            const readingTime = new Date(time);
                            //DateTime readingTime = DateTime.fromMillisecondsSinceEpoch(time);
                            DateFormat dateFormat = DateFormat("yyyy-MM-dd HH:mm");
                            GlobalData.onScreenTimeTaken = DateFormat.jm().format(readingTime).toString();
                            this.sgvs.get(this.currentSensorID)!.sgvMap[i] = new SGV(evalue, time);
                          }
                        }
                        break;
                  

                }
    
                
              });
            });
          });
        });//End of Connect
      });
    });
  }

  

 
}

  







//////

