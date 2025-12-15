-- 智慧校园数据库设计方案
-- SQL Server 数据库创建脚本

-- 创建数据库
CREATE DATABASE CampusSmartDB
GO

USE CampusSmartDB
GO

-- 1. 设备表 - 用于管理校园内的监测设备
CREATE TABLE Devices (
    DeviceID INT PRIMARY KEY IDENTITY(1,1),
    DeviceName NVARCHAR(100) NOT NULL,
    DeviceType NVARCHAR(50) NOT NULL, -- 环境监测设备、交通监测设备等
    Location NVARCHAR(200) NOT NULL, -- 设备安装位置
    InstallationDate DATETIME NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT '正常', -- 正常、故障、维护中
    LastMaintenanceDate DATETIME,
    Longitude DECIMAL(10, 6),
    Latitude DECIMAL(10, 6),
    IsActive BIT NOT NULL DEFAULT 1
)
GO

-- 2. 环境监测数据表 - 存储环境监测数据
CREATE TABLE EnvironmentData (
    DataID BIGINT PRIMARY KEY IDENTITY(1,1),
    DeviceID INT NOT NULL,
    RecordTime DATETIME NOT NULL DEFAULT GETDATE(),
    Temperature DECIMAL(5, 2), -- 温度（摄氏度）
    Humidity DECIMAL(5, 2), -- 湿度（百分比）
    WindSpeed DECIMAL(5, 2), -- 风速（m/s）
    WindDirection NVARCHAR(20), -- 风向
    PM25 DECIMAL(5, 2), -- PM2.5浓度
    PM10 DECIMAL(5, 2), -- PM10浓度
    CO2 DECIMAL(5, 2), -- CO2浓度
    Noise DECIMAL(5, 2), -- 噪音（分贝）
    FOREIGN KEY (DeviceID) REFERENCES Devices(DeviceID)
)
GO

-- 3. 天气数据表 - 存储天气信息
CREATE TABLE WeatherData (
    WeatherID BIGINT PRIMARY KEY IDENTITY(1,1),
    RecordDate DATE NOT NULL,
    RecordTime TIME NOT NULL,
    Temperature DECIMAL(5, 2),
    Humidity DECIMAL(5, 2),
    WindSpeed DECIMAL(5, 2),
    WindDirection NVARCHAR(20),
    WeatherCondition NVARCHAR(50), -- 天气状况（晴、多云、雨等）
    Precipitation DECIMAL(5, 2), -- 降水量
    UVIndex INT, -- 紫外线指数
    AirQualityIndex INT, -- 空气质量指数
    WeatherSource NVARCHAR(100) -- 数据来源
)
GO

-- 4. 交通数据表 - 存储交通监测数据
CREATE TABLE TrafficData (
    TrafficID BIGINT PRIMARY KEY IDENTITY(1,1),
    DeviceID INT NOT NULL,
    RecordTime DATETIME NOT NULL DEFAULT GETDATE(),
    TrafficFlow INT, -- 车流量
    AverageSpeed DECIMAL(5, 2), -- 平均车速
    CongestionLevel NVARCHAR(20), -- 拥堵等级
    VehicleTypeDistribution NVARCHAR(200), -- 车型分布（JSON格式）
    FOREIGN KEY (DeviceID) REFERENCES Devices(DeviceID)
)
GO

-- 5. 区域信息表 - 存储校园区域划分
CREATE TABLE Areas (
    AreaID INT PRIMARY KEY IDENTITY(1,1),
    AreaName NVARCHAR(100) NOT NULL,
    AreaType NVARCHAR(50), -- 教学区、生活区、运动区等
    Description NVARCHAR(500),
    ParentAreaID INT, -- 上级区域ID，用于树形结构
    FOREIGN KEY (ParentAreaID) REFERENCES Areas(AreaID)
)
GO

-- 6. 数据统计视图 - 环境数据小时统计
CREATE VIEW v_EnvironmentHourlyStats AS
SELECT 
    DeviceID,
    DATEPART(HOUR, RecordTime) AS Hour,
    AVG(Temperature) AS AvgTemperature,
    AVG(Humidity) AS AvgHumidity,
    AVG(WindSpeed) AS AvgWindSpeed,
    COUNT(*) AS DataCount
FROM EnvironmentData
WHERE RecordTime >= DATEADD(DAY, -1, GETDATE())
GROUP BY DeviceID, DATEPART(HOUR, RecordTime)
GO

-- 7. 创建索引，提高查询性能
CREATE INDEX IX_EnvironmentData_DeviceID_RecordTime ON EnvironmentData(DeviceID, RecordTime DESC)
CREATE INDEX IX_WeatherData_RecordDate ON WeatherData(RecordDate)
CREATE INDEX IX_TrafficData_DeviceID_RecordTime ON TrafficData(DeviceID, RecordTime DESC)
CREATE INDEX IX_Devices_Status ON Devices(Status)
GO

-- 8. 示例数据插入
-- 插入设备数据
INSERT INTO Devices (DeviceName, DeviceType, Location, InstallationDate, Status, Longitude, Latitude)
VALUES 
    ('文科楼环境监测站', '环境监测设备', '文科教学楼楼顶', '2023-01-15', '正常', 116.397428, 39.90923),
    ('校园北门交通摄像头', '交通监测设备', '校园北门', '2023-02-20', '正常', 116.395428, 39.91023),
    ('宿舍区环境监测站', '环境监测设备', '学生宿舍1号楼', '2023-03-10', '正常', 116.398428, 39.90823)
GO

-- 插入环境数据
INSERT INTO EnvironmentData (DeviceID, RecordTime, Temperature, Humidity, WindSpeed, WindDirection)
VALUES 
    (1, GETDATE(), 23.5, 65.2, 3.2, '东北风'),
    (1, DATEADD(MINUTE, -5, GETDATE()), 23.3, 64.8, 3.0, '东风'),
    (3, GETDATE(), 24.1, 62.5, 2.8, '东南风')
GO

-- 插入天气数据
INSERT INTO WeatherData (RecordDate, RecordTime, Temperature, Humidity, WindSpeed, WindDirection, WeatherCondition)
VALUES 
    (GETDATE(), CONVERT(TIME, GETDATE()), 23.8, 63.5, 3.5, '东北风', '晴'),
    (GETDATE(), CONVERT(TIME, DATEADD(HOUR, -1, GETDATE())), 22.5, 66.2, 2.9, '东风', '多云')
GO

-- 插入交通数据
INSERT INTO TrafficData (DeviceID, RecordTime, TrafficFlow, AverageSpeed, CongestionLevel)
VALUES 
    (2, GETDATE(), 45, 32.5, '畅通'),
    (2, DATEADD(MINUTE, -5, GETDATE()), 52, 28.3, '轻度拥堵')
GO

-- 插入区域数据
INSERT INTO Areas (AreaName, AreaType, Description)
VALUES 
    ('整个校园', '校园', '智慧校园整体区域'),
    ('教学区', '功能区', '校园教学区域'),
    ('生活区', '功能区', '学生和教职工生活区域'),
    ('文科教学楼', '建筑', '文科教学主要建筑', 2),
    ('学生宿舍1号楼', '建筑', '学生宿舍', 3)
GO

-- 查询示例
SELECT 
    d.DeviceName,
    e.RecordTime,
    e.Temperature,
    e.Humidity,
    e.WindSpeed,
    e.WindDirection
FROM EnvironmentData e
JOIN Devices d ON e.DeviceID = d.DeviceID
WHERE e.RecordTime >= DATEADD(HOUR, -24, GETDATE())
ORDER BY e.RecordTime DESC
GO

-- 数据库关系说明：
-- 1. Devices表与EnvironmentData表：一对多关系，一个设备可以产生多条环境数据
-- 2. Devices表与TrafficData表：一对多关系，一个设备可以产生多条交通数据
-- 3. Areas表与自身：自引用关系，用于表示区域的层级结构
-- 4. WeatherData表：独立表，存储天气信息，可按日期和时间查询

-- 数据采集建议：
-- 1. 环境数据：每5分钟采集一次
-- 2. 天气数据：每小时更新一次
-- 3. 交通数据：每2分钟采集一次
-- 4. 设备状态：实时监测，状态变化时更新

-- 数据保留策略：
-- 1. 原始数据：保留1年
-- 2. 小时统计数据：保留5年
-- 3. 日统计数据：永久保留

-- 安全建议：
-- 1. 创建专门的数据库用户，设置最小权限
-- 2. 对敏感数据进行加密
-- 3. 定期备份数据库
-- 4. 设置数据库审计，记录关键操作
