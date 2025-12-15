using CampusSmartAPI.Models;
using CampusSmartAPI.Repositories;

namespace CampusSmartAPI.Services
{
    /// <summary>
    /// 设备服务实现
    /// </summary>
    public class DeviceService : IDeviceService
    {
        private readonly IRepository<Device> _deviceRepository;
        
        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="deviceRepository">设备数据访问对象</param>
        public DeviceService(IRepository<Device> deviceRepository)
        {
            _deviceRepository = deviceRepository;
        }
        
        /// <inheritdoc/>
        public async Task<IEnumerable<Device>> GetAllDevicesAsync()
        {
            return await _deviceRepository.GetAllAsync();
        }
        
        /// <inheritdoc/>
        public async Task<Device> GetDeviceByIdAsync(int id)
        {
            return await _deviceRepository.GetByIdAsync(id);
        }
        
        /// <inheritdoc/>
        public async Task<IEnumerable<Device>> GetDevicesByStatusAsync(string status)
        {
            return await _deviceRepository.GetAsync(d => d.Status == status);
        }
        
        /// <inheritdoc/>
        public async Task<IEnumerable<Device>> GetDevicesByTypeAsync(string type)
        {
            return await _deviceRepository.GetAsync(d => d.DeviceType == type);
        }
        
        /// <inheritdoc/>
        public async Task<Device> AddDeviceAsync(Device device)
        {
            return await _deviceRepository.AddAsync(device);
        }
        
        /// <inheritdoc/>
        public async Task<Device> UpdateDeviceAsync(Device device)
        {
            return await _deviceRepository.UpdateAsync(device);
        }
        
        /// <inheritdoc/>
        public async Task<bool> DeleteDeviceAsync(int id)
        {
            return await _deviceRepository.DeleteByIdAsync(id);
        }
        
        /// <inheritdoc/>
        public async Task<Device> UpdateDeviceStatusAsync(int id, string status)
        {
            var device = await GetDeviceByIdAsync(id);
            if (device == null)
            {
                return null;
            }
            
            device.Status = status;
            return await UpdateDeviceAsync(device);
        }
    }
}