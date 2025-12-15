using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampusSmartAPI.Models
{
    /// <summary>
    /// 交通数据表 - 存储交通监测数据
    /// </summary>
    public class TrafficData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long TrafficID { get; set; }
        
        [Required]
        public int DeviceID { get; set; }
        
        [Required]
        public DateTime RecordTime { get; set; } = DateTime.Now;
        
        public int? TrafficFlow { get; set; } // 车流量
        
        public decimal? AverageSpeed { get; set; } // 平均车速
        
        [MaxLength(20)]
        public string CongestionLevel { get; set; } // 拥堵等级
        
        [MaxLength(200)]
        public string VehicleTypeDistribution { get; set; } // 车型分布（JSON格式）
        
        // 导航属性
        [ForeignKey("DeviceID")]
        public Device Device { get; set; }
    }
}