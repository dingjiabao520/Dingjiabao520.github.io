using Microsoft.EntityFrameworkCore; using Microsoft.EntityFrameworkCore.Design; using Microsoft.Extensions.Configuration; using System.IO;

namespace CampusSmartAPI.Data
{
    /// <summary>
    /// 智慧校园数据库上下文设计时工厂
    /// 用于在设计时（如执行ef migrations命令）创建DbContext实例
    /// </summary>
    public class CampusSmartDbContextFactory : IDesignTimeDbContextFactory<CampusSmartDbContext>
    {
        /// <inheritdoc/>
        public CampusSmartDbContext CreateDbContext(string[] args)
        {
            // 构建配置
            IConfigurationBuilder configurationBuilder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: true);
            
            IConfiguration configuration = configurationBuilder.Build();
            
            // 获取数据库连接字符串
            string connectionString = configuration.GetConnectionString("CampusSmartDB");
            
            // 配置DbContext选项
            DbContextOptionsBuilder<CampusSmartDbContext> optionsBuilder = new DbContextOptionsBuilder<CampusSmartDbContext>();
            optionsBuilder.UseSqlServer(connectionString);
            
            return new CampusSmartDbContext(optionsBuilder.Options);
        }
    }
}