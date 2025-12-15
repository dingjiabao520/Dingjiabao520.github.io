using CampusSmartAPI.Models;
using CampusSmartAPI.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CampusSmartAPI.Services
{
    /// <summary>
    /// 环境数据服务实现
    /// </summary>
    public class EnvironmentService : IEnvironmentService
    {
        private readonly IRepository<EnvironmentData> _environmentRepository;
        
        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="environmentRepository">环境数据访问对象</param>
        public EnvironmentService(IRepository<EnvironmentData> environmentRepository)
        {
            _environmentRepository = environmentRepository;
        }
        
        /// <inheritdoc/>
        public async Task<IEnumerable<EnvironmentData>> GetAllEnvironmentDataAsync()
        {
            return await _environmentRepository.GetAllAsync();
        }
        
        /// <inheritdoc/>
        public async Task<IEnumerable<EnvironmentData>> GetEnvironmentDataByDeviceIdAsync(int deviceId)
        {
            return await _environmentRepository.GetAsync(ed => ed.DeviceID == deviceId);
        }
        
        /// <inheritdoc/>
        public async Task<IEnumerable<EnvironmentData>> GetEnvironmentDataByTimeRangeAsync(DateTime startTime, DateTime endTime)
        {
            return await _environmentRepository.GetAsync(ed => ed.RecordTime >= startTime && ed.RecordTime <= endTime);
        }
        
        /// <inheritdoc/>
        public async Task<EnvironmentData> AddEnvironmentDataAsync(EnvironmentData environmentData)
        {
            return await _environmentRepository.AddAsync(environmentData);
        }
        
        /// <inheritdoc/>
        public async Task<int> AddEnvironmentDataRangeAsync(IEnumerable<EnvironmentData> environmentDataList)
        {
            return await _environmentRepository.AddRangeAsync(environmentDataList);
        }
        
        /// <inheritdoc/>
        public async Task<EnvironmentData> GetLatestEnvironmentDataByDeviceIdAsync(int deviceId)
        {
            var data = await _environmentRepository.GetAsync(ed => ed.DeviceID == deviceId);
            return data.OrderByDescending(ed => ed.RecordTime).FirstOrDefault();
        }
    }
}