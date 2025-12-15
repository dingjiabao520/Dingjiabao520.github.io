using CampusSmartAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CampusSmartAPI.Data
{
    /// <summary>
    /// 智慧校园数据库上下文
    /// </summary>
    public class CampusSmartDbContext : DbContext
    {
        public CampusSmartDbContext(DbContextOptions<CampusSmartDbContext> options) : base(options)
        {
        }
        
        // 数据库表
        public DbSet<Device> Devices { get; set; }
        public DbSet<EnvironmentData> EnvironmentData { get; set; }
        public DbSet<WeatherData> WeatherData { get; set; }
        public DbSet<TrafficData> TrafficData { get; set; }
        public DbSet<Area> Areas { get; set; }
        
        // 3D模型相关表
        public DbSet<ModelInfo> ModelInfos { get; set; }
        public DbSet<ModelPart> ModelParts { get; set; }
        public DbSet<ModelData> ModelDatas { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 配置关系
            modelBuilder.Entity<EnvironmentData>()
                .HasOne(ed => ed.Device)
                .WithMany(d => d.EnvironmentData)
                .HasForeignKey(ed => ed.DeviceID);
            
            modelBuilder.Entity<TrafficData>()
                .HasOne(td => td.Device)
                .WithMany(d => d.TrafficData)
                .HasForeignKey(td => td.DeviceID);
            
            modelBuilder.Entity<Area>()
                .HasOne(a => a.ParentArea)
                .WithMany(a => a.ChildAreas)
                .HasForeignKey(a => a.ParentAreaID);
            
            // 配置索引
            modelBuilder.Entity<EnvironmentData>()
                .HasIndex(ed => new { ed.DeviceID, ed.RecordTime })
                .IsDescending(false, true);
            
            modelBuilder.Entity<WeatherData>()
                .HasIndex(wd => wd.RecordDate);
            
            modelBuilder.Entity<TrafficData>()
                .HasIndex(td => new { td.DeviceID, td.RecordTime })
                .IsDescending(false, true);
            
            modelBuilder.Entity<Device>()
                .HasIndex(d => d.Status);
            
            // 3D模型相关表配置
            // ModelPart关系配置
            modelBuilder.Entity<ModelPart>()
                .HasOne(mp => mp.Model)
                .WithMany(mi => mi.ModelParts)
                .HasForeignKey(mp => mp.ModelID);
            
            // ModelData关系配置
            modelBuilder.Entity<ModelData>()
                .HasOne(md => md.Model)
                .WithMany(mi => mi.ModelDatas)
                .HasForeignKey(md => md.ModelID);
            
            // 配置索引
            modelBuilder.Entity<ModelInfo>()
                .HasIndex(mi => new { mi.ModelName, mi.ModelType });
            
            modelBuilder.Entity<ModelPart>()
                .HasIndex(mp => new { mp.ModelID, mp.PartIndex });
            
            modelBuilder.Entity<ModelData>()
                .HasIndex(md => new { md.ModelID, md.DataType, md.DataKey });
        }
    }
}