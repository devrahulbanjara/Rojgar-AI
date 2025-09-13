import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Building2, Globe, MapPin, Palette, Plus, Save, Upload, X } from 'lucide-react';

export default function CompanyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [benefits, setBenefits] = useState(['Health Insurance', 'Remote Work', '401k', 'Flexible Hours']);
  const [benefitInput, setBenefitInput] = useState('');
  const [companyData, setCompanyData] = useState({
    name: 'TechCorp Solutions',
    website: 'https://techcorp.example.com',
    size: '201-500',
    industry: 'Technology',
    headquarters: 'San Francisco, CA',
    about: 'We are a leading technology company focused on innovative solutions...',
    brandColor: '#2563eb'
  });

  const handleAddBenefit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && benefitInput.trim()) {
      e.preventDefault();
      if (!benefits.includes(benefitInput.trim())) {
        setBenefits([...benefits, benefitInput.trim()]);
      }
      setBenefitInput('');
    }
  };

  const removeBenefit = (benefit: string) => {
    setBenefits(benefits.filter(b => b !== benefit));
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your company profile has been saved successfully."
    });
  };

  const handleColorChange = (color: string) => {
    setCompanyData({...companyData, brandColor: color});
    // Update CSS variables
    document.documentElement.style.setProperty('--brand', color);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Company Profile</h1>
          <p className="text-muted-foreground">Manage your company information and branding</p>
        </div>
        <Button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>Edit Profile</>
          )}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyData.name}
                onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="flex gap-2">
                <Globe className="h-5 w-5 text-muted-foreground mt-2" />
                <Input
                  id="website"
                  value={companyData.website}
                  onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Company Size</Label>
              <Select
                value={companyData.size}
                onValueChange={(value) => setCompanyData({...companyData, size: value})}
                disabled={!isEditing}
              >
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501-1000">501-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={companyData.industry}
                onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headquarters">Headquarters</Label>
              <div className="flex gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-2" />
                <Input
                  id="headquarters"
                  value={companyData.headquarters}
                  onChange={(e) => setCompanyData({...companyData, headquarters: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding & Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop or click to upload
                </p>
                <Button variant="outline" size="sm" disabled={!isEditing}>
                  Choose File
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-color">Brand Color</Label>
              <div className="flex gap-2">
                <Palette className="h-5 w-5 text-muted-foreground mt-2" />
                <div className="flex gap-2 items-center">
                  <Input
                    id="brand-color"
                    type="color"
                    value={companyData.brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    disabled={!isEditing}
                    className="w-20 h-10"
                  />
                  <Input
                    value={companyData.brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    disabled={!isEditing}
                    className="flex-1"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This color will be used throughout your job postings
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About Company</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Tell candidates about your company culture, mission, and values..."
              className="min-h-[150px]"
              value={companyData.about}
              onChange={(e) => setCompanyData({...companyData, about: e.target.value})}
              disabled={!isEditing}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Benefits & Perks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="benefits">Add Benefit</Label>
                <Input
                  id="benefits"
                  placeholder="Type a benefit and press Enter"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyDown={handleAddBenefit}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {benefits.map((benefit) => (
                <Badge key={benefit} variant="secondary" className="flex items-center gap-1 py-1.5">
                  {benefit}
                  {isEditing && (
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeBenefit(benefit)}
                    />
                  )}
                </Badge>
              ))}
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={() => {
                    const newBenefit = prompt('Enter a new benefit:');
                    if (newBenefit && !benefits.includes(newBenefit)) {
                      setBenefits([...benefits, newBenefit]);
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}