using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampusSmartAPI.Models
{
    /// <summary>
    /// 区域信息表 - 存储校园区域划分
    /// </summary>
    public class Area
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AreaID { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string AreaName { get; set; }
        
        [MaxLength(50)]
        public string AreaType { get; set; } // 校园、教学区、生活区、运动区等
        
        [MaxLength(500)]
        public string Description { get; set; }
        
        public int? ParentAreaID { get; set; } // 上级区域ID，用于树形结构
        
        // 导航属性
        [ForeignKey("ParentAreaID")]
        public Area ParentArea { get; set; }
        public ICollection<Area> ChildAreas { get; set; }
    }
}