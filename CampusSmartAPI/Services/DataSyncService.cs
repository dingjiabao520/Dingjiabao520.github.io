using CampusSmartAPI.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CampusSmartAPI.Services
{
    /// <summary>
    /// 数据同步服务，用于定期从外部API获取数据并保存到数据库，同时清理旧数据
    /// </summary>
    public class DataSyncService : BackgroundService
    {
        private readonly IExternalApiService _externalApiService;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DataSyncService> _logger;
        
        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="externalApiService">外部API服务</param>
        /// <param name="scopeFactory">服务作用域工厂</param>
        /// <param name="logger">日志对象</param>
        public DataSyncService(
            IExternalApiService externalApiService,
            IServiceScopeFactory scopeFactory,
            ILogger<DataSyncService> logger)
        {
            _externalApiService = externalApiService;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }
        
        /// <inheritdoc/>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("数据同步服务已启动");
            
            // 初始延迟10秒，等待系统完全启动
            await Task.Delay(10000, stoppingToken);
            
            // 每分钟执行一次同步任务
            var syncInterval = TimeSpan.FromMinutes(1);
            
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("开始执行数据同步任务");
                    
                    // 1. 从外部API获取数据
                    var externalData = await _externalApiService.FetchEnvironmentDataFromExternalApiAsync();
                    
                    // 创建临时作用域，用于获取Scoped服务
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        // 获取环境服务实例
                        var environmentService = scope.ServiceProvider.GetRequiredService<IEnvironmentService>();
                        
                        // 2. 将数据保存到数据库
                        if (externalData.Any())
                        {
                            await environmentService.AddEnvironmentDataRangeAsync(externalData);
                            _logger.LogInformation($"成功保存 {externalData.Count()} 条环境数据到数据库");
                        }
                        
                        // 获取数据库上下文实例
                        var dbContext = scope.ServiceProvider.GetRequiredService<CampusSmartDbContext>();
                        
                        // 3. 清理7天前的旧数据
                        await CleanupOldDataAsync(dbContext, stoppingToken);
                    }
                    
                    _logger.LogInformation("数据同步任务执行完成");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "数据同步任务执行失败");
                }
                
                // 等待下一次执行
                await Task.Delay(syncInterval, stoppingToken);
            }
            
            _logger.LogInformation("数据同步服务已停止");
        }
        
        /// <summary>
        /// 清理旧数据
        /// </summary>
        /// <param name="dbContext">数据库上下文</param>
        /// <param name="cancellationToken">取消令牌</param>
        /// <returns>清理的记录数量</returns>
        private async Task<int> CleanupOldDataAsync(CampusSmartDbContext dbContext, CancellationToken cancellationToken)
        {
            try
            {
                // 计算7天前的日期
                var sevenDaysAgo = DateTime.Now.AddDays(-7);
                
                // 清理环境数据
                var environmentDataCount = await dbContext.EnvironmentData
                    .Where(ed => ed.RecordTime < sevenDaysAgo)
                    .ExecuteDeleteAsync(cancellationToken);
                
                // 清理交通数据
                var trafficDataCount = await dbContext.TrafficData
                    .Where(td => td.RecordTime < sevenDaysAgo)
                    .ExecuteDeleteAsync(cancellationToken);
                
                // 清理天气数据
                var weatherDataCount = await dbContext.WeatherData
                    .Where(wd => wd.RecordDate < DateOnly.FromDateTime(sevenDaysAgo))
                    .ExecuteDeleteAsync(cancellationToken);
                
                var totalCount = environmentDataCount + trafficDataCount + weatherDataCount;
                _logger.LogInformation($"成功清理 {totalCount} 条旧数据（环境数据：{environmentDataCount}，交通数据：{trafficDataCount}，天气数据：{weatherDataCount}）");
                
                return totalCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "清理旧数据失败");
                return 0;
            }
        }
    }
}