using CampusSmartAPI.Models;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;

namespace CampusSmartAPI.Services
{
    /// <summary>
    /// 外部API服务实现
    /// </summary>
    public class ExternalApiService : IExternalApiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _externalApiUrl;
        
        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="httpClient">HTTP客户端</param>
        /// <param name="configuration">配置对象</param>
        public ExternalApiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _externalApiUrl = configuration["ExternalApi:Url"] ?? "https://example.com/api/environment";
        }
        
        /// <inheritdoc/>
        public async Task<IEnumerable<EnvironmentData>> FetchEnvironmentDataFromExternalApiAsync()
        {
            try
            {
                // 从外部API获取数据
                // 这里使用示例URL，实际开发中需要替换为真实的外部API地址
                var response = await _httpClient.GetAsync(_externalApiUrl);
                response.EnsureSuccessStatusCode();
                
                // 解析响应数据
                var externalData = await response.Content.ReadFromJsonAsync<IEnumerable<ExternalEnvironmentData>>();
                
                if (externalData == null)
                {
                    return Enumerable.Empty<EnvironmentData>();
                }
                
                // 转换为内部环境数据模型
                return externalData.Select(data => new EnvironmentData
                {
                    DeviceID = data.DeviceId,
                    RecordTime = DateTime.Now,
                    Temperature = data.Temperature,
                    Humidity = data.Humidity,
                    WindSpeed = data.WindSpeed,
                    WindDirection = data.WindDirection,
                    PM25 = data.PM25,
                    PM10 = data.PM10,
                    CO2 = data.CO2,
                    Noise = data.Noise
                });
            }
            catch (Exception ex)
            {
                // 记录日志，实际开发中应该使用日志框架
                Console.WriteLine($"从外部API获取数据失败: {ex.Message}");
                return Enumerable.Empty<EnvironmentData>();
            }
        }
        
        // 外部API数据模型（示例）
        private class ExternalEnvironmentData
        {
            public int DeviceId { get; set; }
            public decimal Temperature { get; set; }
            public decimal Humidity { get; set; }
            public decimal WindSpeed { get; set; }
            public string WindDirection { get; set; }
            public decimal PM25 { get; set; }
            public decimal PM10 { get; set; }
            public decimal CO2 { get; set; }
            public decimal Noise { get; set; }
        }
    }
}