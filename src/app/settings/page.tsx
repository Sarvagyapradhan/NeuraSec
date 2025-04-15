"use client";

import { BackgroundGradient } from "@/components/ui/background-gradient";
import { Button } from "@/components/ui/button";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { MovingBorder } from "@/components/ui/moving-border";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Lock,
  Mail,
  Shield,
  Smartphone,
  User,
  Zap,
} from "lucide-react";

const settingSections = [
  {
    title: "Account Settings",
    icon: User,
    settings: [
      {
        label: "Email Address",
        type: "input",
        value: "john.doe@example.com",
        icon: Mail,
      },
      {
        label: "Two-Factor Authentication",
        type: "switch",
        value: true,
        icon: Lock,
      },
      {
        label: "Account Type",
        type: "select",
        value: "pro",
        options: ["basic", "pro", "enterprise"],
        icon: Zap,
      },
    ],
  },
  {
    title: "Security Preferences",
    icon: Shield,
    settings: [
      {
        label: "Real-time Scanning",
        type: "switch",
        value: true,
        icon: Shield,
      },
      {
        label: "Mobile Notifications",
        type: "switch",
        value: true,
        icon: Smartphone,
      },
      {
        label: "Email Alerts",
        type: "switch",
        value: true,
        icon: Bell,
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-black pt-20 pb-10">
      <div className="container mx-auto px-4">
        <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-zinc-400">Manage your account and security preferences</p>
        </BackgroundGradient>

        <div className="grid gap-8">
          {settingSections.map((section) => (
            <CardContainer key={section.title}>
              <CardBody className="bg-zinc-900">
                <CardItem translateZ={20}>
                  <div className="flex items-center gap-3 mb-6">
                    <section.icon className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                  </div>
                </CardItem>

                <CardItem translateZ={30}>
                  <MovingBorder className="p-6 space-y-6">
                    {section.settings.map((setting) => (
                      <div key={setting.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-zinc-800">
                            <setting.icon className="h-4 w-4 text-primary" />
                          </div>
                          <Label className="text-zinc-300">{setting.label}</Label>
                        </div>

                        {setting.type === "input" && (
                          <Input
                            value={String(setting.value)}
                            className="max-w-[240px] bg-zinc-800 border-zinc-700"
                          />
                        )}

                        {setting.type === "switch" && (
                          <Switch checked={Boolean(setting.value)} />
                        )}

                        {setting.type === "select" && (
                          <Select defaultValue={String(setting.value)}>
                            <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {setting.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </MovingBorder>
                </CardItem>

                <CardItem translateZ={20} className="mt-6">
                  <div className="flex justify-end gap-3">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="mt-8">
          <MovingBorder className="p-6 bg-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-red-500">Danger Zone</h3>
                <p className="text-zinc-400 text-sm mt-1">
                  Irreversible and destructive actions
                </p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </MovingBorder>
        </div>
      </div>
    </div>
  );
} 